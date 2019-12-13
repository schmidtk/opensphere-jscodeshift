const jscs = require('jscodeshift');
const {addLegacyNamespace} = require('../../utils/goog');
const {createCall, createFindCallFn, createFindMemberExprObject} = require('../../utils/jscs');
const {addMethodToClass, addStaticGetToClass, isClosureClass, isPrivate, splitCommentsForClass} = require('../../utils/classes');
const {registerClassNode, getClassNode} = require('../../utils/classregistry');
const {logger} = require('../../utils/logger');

let root;

/**
 * Insert the node prior to the named class declaration.
 */
const insertBeforeClass = (className, node) => {
  root.find(jscs.ClassDeclaration, {id: {name: className}}).forEach(path => {
    jscs(path.parent).insertBefore(node);
  });
};

/**
 * Convert a private static property on the class to a local variable.
 */
const convertPrivateClassPropertyToConst = (path, moduleName) => {
  const propertyName = path.value.left.property.name;
  const varDeclarator = jscs.variableDeclarator(jscs.identifier(propertyName), path.value.right);
  const varDeclaration = jscs.variableDeclaration('const', [varDeclarator]);

  const newComment = path.parent.value.comments.pop().value.split('\n')
      .filter(comment => !(/^\* @(private|const)$/.test(comment.trim())))
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
  root.find(jscs.MemberExpression, createFindMemberExprObject(`${moduleName}.${propertyName}`)).forEach(path => {
    jscs(path).replaceWith(jscs.identifier(propertyName));
  });
};

/**
 * Adds a method to a class.
 */
const convertStaticProperty = (path, moduleName) => {
  if (path.value.right.type === 'FunctionExpression') {
    const classMethod = addMethodToClass(moduleName, path.value.left.property.name, path.value.right, true);
    classMethod.comments = path.parent.value.comments;

    jscs(path).remove();
  } else if (isPrivate(path.parent.value)) {
    convertPrivateClassPropertyToConst(path, moduleName);
  } else {
    addStaticGetToClass(path, moduleName);
  }
};

const movePrototypeToClass = (path, moduleName) => {
  const propertyName = path.value.left.property.name;
  if (path.value.right.type === 'FunctionExpression') {
    const classMethod = addMethodToClass(moduleName, propertyName, path.value.right, false);
    classMethod.comments = path.parent.value.comments;

    jscs(path).remove();
  } else {
    logger.warn(`In ${moduleName}: Unable to move property ${propertyName}. Value is not a function.`);
  }
};

const moveInheritsToClass = (path, moduleName) => {
  const classDef = getClassNode(moduleName);
  if (classDef) {
    classDef.superClass = path.value.arguments[1];
    jscs(path).remove();
  }
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
      object: createFindMemberExprObject(`${moduleName}.prototype`)
    }
  }).forEach(path => movePrototypeToClass(path, moduleName));

  // move all static properties to the class
  root.find(jscs.AssignmentExpression, {
    left: {
      type: 'MemberExpression',
      object: createFindMemberExprObject(moduleName)
    }
  }).forEach(path => convertStaticProperty(path, moduleName));

  // move goog.addSingletonGetter to a class getInstance function
  root.find(jscs.CallExpression, {
    callee: createFindMemberExprObject('goog.addSingletonGetter'),
    arguments: [createFindMemberExprObject(moduleName)]
  }).forEach(path => moveSingletonToClass(path, moduleName));

  // move goog.inherits to class extends keyword
  root.find(jscs.CallExpression, {
    callee: createFindMemberExprObject('goog.inherits'),
    arguments: [createFindMemberExprObject(moduleName)]
  }).forEach(path => moveInheritsToClass(path, moduleName));

  // add exports statement for the class
  addExports(path.parent.parent.value, className);
};

module.exports = (file, api, options) => {
  root = jscs(file.source);

  const modules = [];

  // replace all goog.provide statements with goog.module
  const findFn = createFindCallFn('goog.provide');
  root.find(jscs.CallExpression, findFn).forEach((path, idx, paths) => {
    const args = path.value.arguments;
    modules.push(args[0].value);

    jscs(path).replaceWith(createCall('goog.module', args));

    if (!idx) {
      addLegacyNamespace(path.parent);
    }
  });

  modules.forEach(moduleName => {
    root.find(jscs.AssignmentExpression, {
      left: createFindMemberExprObject(moduleName),
      right: {
        type: 'FunctionExpression'
      }
    }).forEach(path => {
      if (isClosureClass(path.parent.value)) {
        convertClass(path, moduleName);
      }
    });
  });

  return root.toSource();
};
