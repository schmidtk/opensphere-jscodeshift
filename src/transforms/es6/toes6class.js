const jscs = require('jscodeshift');
const {createCall, createFindCallFn} = require('../../utils/jscs');
const {registerClassNode, getClassNode} = require('./classregistry');

let root;

/**
 * Create an object to find a member expression.
 * @param {string} memberPath The dot delimited member expression path.
 * @return {Object}
 */
const createMemberExpression = (memberPath) => {
  const parts = memberPath.split('.').reverse();
  const result = {};

  let current = result;
  while (parts.length) {
    current.property = {
      name: parts.shift()
    }

    if (parts.length > 1) {
      current.type = 'MemberExpression';
      current = current.object = {}
    } else {
      current.object = {
        name: parts.shift(),
        type: 'Identifier'
      }
    }
  }

  return result;
};

/**
 * Adds a method to a class.
 */
const addMethodToClass = (moduleName, methodName, methodValue, isStatic) => {
  let classMethod;

  const classDef = getClassNode(moduleName);
  if (classDef) {
    classMethod = jscs.methodDefinition('method', jscs.identifier(methodName), methodValue, isStatic);
    classDef.body.body.push(classMethod);
  }

  return classMethod;
};

/**
 * Move a static class property to a static get function.
 */
const addStaticGetToClass = (path, moduleName) => {
  const classDef = getClassNode(moduleName);
  if (classDef) {
    const propertyName = path.value.left.property.name;

    const getBlock = jscs.blockStatement([jscs.returnStatement(path.value.right)]);
    const getFn = jscs.functionExpression(null, [], getBlock);
    const staticGet = jscs.methodDefinition('get', jscs.identifier(propertyName), getFn, true);
    staticGet.comments = path.parent.value.comments;
    classDef.body.body.push(staticGet);

    jscs(path).remove();
  }
};

/**
 * Insert the node prior to the named class declaration.
 */
const insertBeforeClass = (className, node) => {
  root.find(jscs.ClassDeclaration, {id: {name: className}}).forEach(path => {
    jscs(path.parent).insertBefore(node);
  });
};

/**
 * Filter unused annotations from local private properties.
 */
const filterLocalPropertyComment = comment => !(/^\* @(private|const)$/.test(comment.trim()));

/**
 * Convert a private static property on the class to a local variable.
 */
const convertPrivateClassPropertyToConst = (path, moduleName) => {
  const propertyName = path.value.left.property.name;
  const varDeclarator = jscs.variableDeclarator(jscs.identifier(propertyName), path.value.right);
  const varDeclaration = jscs.variableDeclaration('const', [varDeclarator]);

  const newComment = path.parent.value.comments.pop().value.split('\n')
      .filter(filterLocalPropertyComment)
      .join('\n');

  varDeclaration.comments = [jscs.commentBlock(newComment)];

  const classDef = getClassNode(moduleName);
  if (classDef) {
    // move prior to the class definition
    insertBeforeClass(classDef.id.name, varDeclaration);
    jscs(path.parent).remove();
  } else {
    // replace in the same position
    jscs(path.parent).replaceWith(varDeclaration);
  }

  // replace local references to the expression
  root.find(jscs.MemberExpression, createMemberExpression(`${moduleName}.${propertyName}`)).forEach(path => {
    jscs(path).replaceWith(jscs.identifier(propertyName));
  });
};

/**
 * If a node is marked private in its comments.
 */
const isPrivate = (path) => {
  return path.parent.value.comments.length && path.parent.value.comments[0].value.indexOf('@private') > -1;
};

/**
 * Adds a method to a class.
 */
const convertStaticProperty = (path, moduleName) => {
  if (path.value.right.type === 'FunctionExpression') {
    const classMethod = addMethodToClass(moduleName, path.value.left.property.name, path.value.right, true);
    classMethod.comments = path.parent.value.comments;

    jscs(path).remove();
  } else if (isPrivate(path)) {
    convertPrivateClassPropertyToConst(path, moduleName);
  } else {
    addStaticGetToClass(path, moduleName);
  }
};

/**
 * Match comments that should be put in the constructor function.
 * @type {RegExp}
 */
const CTOR_COMMENT_REGEXP = /@ngInject/;

/**
 * Split a comment into parts for the class and constructor.
 * @param {string} comment The original class comment.
 * @return {{classComment: string, ctorComment: string}}
 */
const splitCommentsForClass = (comment) => {
  const origParts = comment.split('\n');
  const classCommentParts = ['*'];
  const ctorCommentParts = ['*', ' * Constructor.'];

  let inParam = false;
  for (let i = 0; i < origParts.length; i++) {
    const part = origParts[i];
    const trimmed = part.trim();

    if (trimmed === '*') {
      // skip blank lines, and also assume a @param definition is finished
      inParam = false;
      continue;
    }

    if (inParam && !trimmed.startsWith('*   ')) {
      // assume multi-line params are indented at least two extra spaces
      inParam = false;
    }

    if (trimmed.startsWith('* @constructor')) {
      // ignore @constructor annotation
      continue;
    } else if (trimmed.startsWith('* @param') || inParam) {
      ctorCommentParts.push(part);
      inParam = true;
    } else if (CTOR_COMMENT_REGEXP.test(trimmed)) {
      ctorCommentParts.push(part);
    }else {
      classCommentParts.push(part);
    }
  }

  ctorCommentParts.push(' ');

  return {
    classComment: classCommentParts.join('\n'),
    ctorComment: ctorCommentParts.join('\n')
  };
};

const movePrototypeToClass = (path, moduleName) => {
  const classMethod = addMethodToClass(moduleName, path.value.left.property.name, path.value.right, false);
  classMethod.comments = path.parent.value.comments;

  jscs(path).remove();
};

const moveSingletonToClass = (path, moduleName) => {
  const classDef = getClassNode(moduleName);
  if (classDef) {
    const className = classDef.id.name;
    const newExpression = jscs.newExpression(jscs.identifier(className), []);
    const varDeclarator = jscs.variableDeclarator(jscs.identifier('instance'), newExpression);
    const varDeclaration = jscs.variableDeclaration('const', [varDeclarator]);
    const instanceComment = ['*', ` * Global ${className} instance.`, ` * @type {${className}}`, ' '].join('\n');
    varDeclaration.comments = [jscs.commentBlock(instanceComment)];

    jscs(path.parent).replaceWith(varDeclaration);

    const getInstanceBlock = jscs.blockStatement([jscs.returnStatement(jscs.identifier('instance'))]);
    const getInstanceFn = jscs.functionExpression(null, [], getInstanceBlock);
    const classMethod = addMethodToClass(moduleName, 'getInstance', getInstanceFn, true);
    const getInstanceComments = ['*', ' * Get the global instance.', ` * @return {${className}}`, ' '].join('\n');
    classMethod.comments = [jscs.commentBlock(getInstanceComments)];
  }
};

const addExports = (program, keys) => {
  let assignmentValue;

  if (typeof keys === 'string') {
    // single default export
    assignmentValue = jscs.identifier(keys);
  } else {
    // non-default exports
    const properties = keys.map(key => {
      const property = jscs.property('init', jscs.identifier(key), jscs.identifier(key));
      property.shorthand = true;
      return property;
    });
    assignmentValue = jscs.objectExpression(properties);
  }

  const assignment = jscs.assignmentExpression('=', jscs.identifier('exports'), assignmentValue);
  program.body.push(jscs.expressionStatement(assignment));
};

const convertClass = (path, moduleName) => {
  const className = path.value.left.property.name;

  const ctorFn = jscs.functionExpression(null, path.value.right.params, path.value.right.body);
  const ctor = jscs.methodDefinition('constructor', jscs.identifier('constructor'), ctorFn);

  const comments = path.parent.value.comments;
  if (comments && comments.length) {
    const {classComment, ctorComment} = splitCommentsForClass(comments.pop().value);
    path.parent.value.comments.push(jscs.commentBlock(classComment));
    ctor.comments = [jscs.commentBlock(ctorComment)];
  }

  const classBody = jscs.classBody([ctor]);
  const classDef = jscs.classDeclaration(jscs.identifier(className), classBody);
  jscs(path).replaceWith(classDef);

  registerClassNode(moduleName, classDef);

  // move all prototype functions/properties to the class
  root.find(jscs.AssignmentExpression, {
    left: {
      type: 'MemberExpression',
      object: createMemberExpression(`${moduleName}.prototype`)
    }
  }).forEach(path => movePrototypeToClass(path, moduleName));

  // move all static properties to the class
  root.find(jscs.AssignmentExpression, {
    left: {
      type: 'MemberExpression',
      object: createMemberExpression(moduleName)
    }
  }).forEach(path => convertStaticProperty(path, moduleName));

  // move goog.addSingletonGetter to a class getInstance function
  root.find(jscs.CallExpression, {
    callee: createMemberExpression('goog.addSingletonGetter'),
    arguments: [createMemberExpression(moduleName)]
  }).forEach(path => moveSingletonToClass(path, moduleName));

  // add exports statement for the class
  addExports(path.parent.parent.value, className);
};

module.exports = (file, api, options) => {
  root = jscs(file.source);

  let declareLegacyAdded = false;
  const modules = [];

  // replace all goog.provide statements with goog.module
  const findFn = createFindCallFn('goog.provide');
  root.find(jscs.CallExpression, findFn).forEach(path => {
    const args = path.value.arguments;
    modules.push(args[0].value);

    jscs(path).replaceWith(createCall('goog.module', args));

    if (!declareLegacyAdded) {
      const googModule = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier('module'));
      const callee = jscs.memberExpression(googModule, jscs.identifier('declareLegacyNamespace'));
      const call = jscs.callExpression(callee, []);
      path.parent.insertAfter(jscs.expressionStatement(call));

      declareLegacyAdded = true;
    }
  });

  modules.forEach(moduleName => {
    root.find(jscs.AssignmentExpression, {
      left: createMemberExpression(moduleName),
      right: {
        type: 'FunctionExpression'
      }
    }).forEach(path => {
      if (path.parent.value.comments[0].value.indexOf('@constructor') > -1) {
        convertClass(path, moduleName);
      }
    });
  });

  return root.toSource();
};
