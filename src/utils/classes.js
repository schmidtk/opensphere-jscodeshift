const jscs = require('jscodeshift');
const config = require('config');

const {createFindCallFn, createFindMemberExprObject, getUniqueVarName} = require('./ast');
const {getClassNode, registerClassNode} = require('./classregistry');
const {addExports, getDependency, isConst, isPrivate, isControllerClass} = require('./goog');
const {createCall, memberExpressionToString} = require('./jscs');
const {logger, logWithNode} = require('./logger');

/**
 * Match comments that should be put in the constructor function.
 * @type {RegExp}
 */
const CTOR_COMMENT_REGEXP = /@ngInject/;

/**
 * Match comments that should be put in the constructor function.
 * @type {RegExp}
 */
const COMMENT_IGNORE_REGEXP = /@constructor/;

/**
 * Match parameter name in @param comment.
 * @type {RegExp}
 */
const PARAM_NAME_REGEXP = /@param {[^}]+} ([^\s]+)/;

/**
 * Match @extends JSDoc.
 * @type {RegExp}
 */
const EXTENDS = /@extends/;

/**
 * Match @extends JSDoc with a generic type provided.
 * @type {RegExp}
 */
const EXTENDS_GENERIC = /@extends {.+<.+>}/;

/**
 * Property name to assign UI controller class.
 * @type {string}
 */
const CONTROLLER_NAME = 'Controller';

/**
 * Property name to assign directive functions.
 * @type {string}
 */
const DIRECTIVE_NAME = 'directive';

/**
 * Property name to assign directive functions.
 * @type {string}
 */
const DIRECTIVE_TAG_NAME = 'directiveTag';

/**
 * Adds a method to a class.
 */
const addMethodToClass = (moduleName, methodName, methodValue, isStatic, kind) => {
  let classMethod;

  const classDef = getClassNode(moduleName);
  if (classDef) {
    classMethod = jscs.methodDefinition(kind || 'method', jscs.identifier(methodName), methodValue, isStatic);
    classDef.body.body.push(classMethod);
  }

  return classMethod;
};

/**
 * Move a static class property to a static get function.
 * @param {NodePath} path Path to the property assignment node.
 * @param {string} moduleName The class module name.
 */
const addStaticGetToClass = (path, moduleName) => {
  const classDef = getClassNode(moduleName);
  if (classDef) {
    const varIdentifier = jscs.identifier(path.value.left.property.name);
    const isConstant = isConst(path.parent.value);

    const oldComments = path.parent.value.comments;
    let newComment;
    if (oldComments && oldComments.length) {
      newComment = oldComments[0].value
          .replace('\n * @const', '')
          .replace('@return ', '@type ');
    }

    // replace the current definition with the variable referenced by get/set
    const varDeclarator = jscs.variableDeclarator(varIdentifier, path.value.right);
    const varDeclaration = jscs.variableDeclaration(isConstant ? 'const' : 'let', [varDeclarator]);
    varDeclaration.comments = [jscs.commentBlock(newComment)];

    jscs(path.parent).replaceWith(varDeclaration);

    // create the static get block
    const getBlock = jscs.blockStatement([jscs.returnStatement(varIdentifier)]);
    const getFn = jscs.functionExpression(null, [], getBlock);
    const staticGet = jscs.methodDefinition('get', varIdentifier, getFn, true);

    // add comments to the static get. they will not be added to the static set to avoid duplicate doc entries.
    if (newComment) {
      staticGet.comments = [jscs.commentBlock(newComment)];
    }

    classDef.body.body.push(staticGet);

    // create the static set block if the property isn't a constant
    if (!isConstant) {
      const valueIdentifier = jscs.identifier('value');
      const setBlock = jscs.blockStatement([jscs.expressionStatement(
        jscs.assignmentExpression('=', varIdentifier, valueIdentifier)
      )]);
      const setFn = jscs.functionExpression(null, [valueIdentifier], setBlock);
      const staticSet = jscs.methodDefinition('set', varIdentifier, setFn, true);

      classDef.body.body.push(staticSet);
    }
  }
};

/**
 * Clean up comment block parts before generating the block.
 * @param {Array<string>} commentParts The comment parts.
 */
const createCommentBlockFromParts = (commentParts) => {
  // remove leading/trailing blank comment lines
  while (commentParts.length && (!commentParts[0] || commentParts[0].trim() === '*')) {
    commentParts.shift();
  }

  while (commentParts.length && (!commentParts[commentParts.length - 1] || commentParts[commentParts.length - 1].trim() === '*')) {
    commentParts.pop();
  }

  // default comment block is /*, this makes it /**
  commentParts.unshift('*');

  // indent */ by one space
  commentParts.push(' ');

  return commentParts.join('\n');
};

/**
 * Split a comment into parts for the class and constructor.
 * @param {string} comment The original class comment.
 * @return {{classComment: string, ctorComment: string}}
 */
const splitCommentsForClass = (comment) => {
  const origParts = comment.trim().split('\n');
  const classCommentParts = [];
  const ctorCommentParts = [' * Constructor.'];

  let inParam = false;
  for (let i = 0; i < origParts.length; i++) {
    const part = origParts[i];
    const trimmed = part.trim();

    if (inParam && !trimmed.startsWith('*   ')) {
      // assume multi-line params are indented at least two extra spaces
      inParam = false;
    }

    if (COMMENT_IGNORE_REGEXP.test(trimmed)) {
      // drop blacklisted comment
      continue;
    } else if (EXTENDS.test(trimmed) && !EXTENDS_GENERIC.test(trimmed)) {
      // drop @extends unless it provides a generic type
      continue;
    } else if (trimmed.startsWith('* @param') || inParam) {
      ctorCommentParts.push(part);
      inParam = true;
    } else if (CTOR_COMMENT_REGEXP.test(trimmed)) {
      ctorCommentParts.push(part);
    } else {
      classCommentParts.push(part);
    }
  }

  return {
    body: createCommentBlockFromParts(classCommentParts),
    ctor: createCommentBlockFromParts(ctorCommentParts)
  };
};

/**
 * Convert a static property on the class.
 */
const convertStaticProperty = (root, path, moduleName) => {
  if (path.value.right.type === 'FunctionExpression') {
    const classMethod = addMethodToClass(moduleName, path.value.left.property.name, path.value.right, true);
    classMethod.comments = path.parent.value.comments;

    jscs(path).remove();
  }
};

const convertPrototypeAssignment = (path, moduleName) => {
  const propertyName = path.value.left.property.name;
  const valueType = path.value.right.type;
  if (valueType === 'FunctionExpression') {
    // move functions to the class
    const classMethod = addMethodToClass(moduleName, propertyName, path.value.right, false);
    classMethod.comments = path.parent.value.comments;

    jscs(path).remove();
  } else if (valueType === 'MemberExpression') {
    // convert in place, replacing the module name with the class name (ClassName.prototype.propertyName = value)
    replaceFQClass(path.value.left.object, moduleName);
  } else {
    logWithNode('warn', `Unable to convert prototype expression ${propertyName} of type ${valueType}.`, path.value);
  }
};

const convertPrototypeExpression = (path, moduleName) => {
  const propertyName = path.value.expression.property.name;
  const commentParts = path.value.comments.pop().value.split('\n');

  const args = commentParts.map(comment => {
    const match = comment.trim().match(PARAM_NAME_REGEXP);
    return match && match.length >= 2 ? match[1] : null;
  }).filter(item => !!item).map(param => jscs.identifier(param));

  const fn = jscs.functionExpression(null, args, jscs.blockStatement([]));
  const classMethod = addMethodToClass(moduleName, propertyName, fn, false);
  classMethod.comments = [jscs.commentBlock(commentParts.join('\n'))];

  jscs(path).remove();
};

/**
 * Move a `goog.inherits` expression to the class extends syntax.
 * @param {NodePath} path Path to the goog.inherits expression.
 * @param {string} moduleName The module name.
 */
const moveInheritsToClass = (path, moduleName) => {
  const classDef = getClassNode(moduleName);
  if (classDef) {
    classDef.superClass = path.value.arguments[1];
    jscs(path).remove();
  }
};

/**
 * Replace a fully-qualified class member expression with the class name, for local references.
 * @param {Node} node The member expression.
 * @param {string} moduleName The module name.
 */
const replaceFQClass = (node, moduleName) => {
  const classDef = getClassNode(moduleName);
  if (classDef) {
    node.object = jscs.identifier(classDef.id.name);
  }
};

/**
 * Move a `goog.addSingletonInstance` call to a static get on the class.
 * @param {NodePath} path The path.
 * @param {string} moduleName The module name.
 */
const moveSingletonToClass = (path, moduleName) => {
  const classDef = getClassNode(moduleName);
  if (classDef) {
    const className = classDef.id.name;
    const instanceIdentifier = jscs.identifier('instance');
    const varDeclarator = jscs.variableDeclarator(instanceIdentifier, null);
    const varDeclaration = jscs.variableDeclaration('let', [varDeclarator]);
    const instanceComment = ['*', ` * Global instance.`, ` * @type {${className}|undefined}`, ' '].join('\n');
    varDeclaration.comments = [jscs.commentBlock(instanceComment)];

    jscs(path.parent).replaceWith(varDeclaration);

    const getInstanceFn = jscs.functionExpression(null, [], jscs.blockStatement([
      jscs.ifStatement(
        jscs.unaryExpression('!', instanceIdentifier, true),
        jscs.blockStatement([
          jscs.expressionStatement(
            jscs.assignmentExpression('=', instanceIdentifier, jscs.newExpression(jscs.identifier(className), []))
          )
        ])
      ),
      jscs.returnStatement(instanceIdentifier)
    ]));
    const getInstanceMethod = addMethodToClass(moduleName, 'getInstance', getInstanceFn, true);
    const getInstanceComments = ['*', ' * Get the global instance.', ` * @return {!${className}}`, ' '].join('\n');
    getInstanceMethod.comments = [jscs.commentBlock(getInstanceComments)];

    const setInstanceFn = jscs.functionExpression(null, [jscs.identifier('value')], jscs.blockStatement([
      jscs.expressionStatement(
        jscs.assignmentExpression('=', instanceIdentifier, jscs.identifier('value'))
      )
    ]));
    const setInstanceMethod = addMethodToClass(moduleName, 'setInstance', setInstanceFn, true);
    const setInstanceComments = ['*', ' * Set the global instance.', ` * @param {${className}} value`, ' '].join('\n');
    setInstanceMethod.comments = [jscs.commentBlock(setInstanceComments)];
  }
};

const replaceBaseWithSuper = (path, moduleName) => {
  const args = path.value.arguments;
  if (args[1].type === 'Literal') {
    const fnName = args[1].value;
    const superArgs = args.slice(2);

    let superCall;
    if (fnName === 'constructor') {
      superCall = jscs.callExpression(jscs.super(), superArgs);
      // TODO: detect "this" before super and log a warning
    } else {
      const superMember = jscs.memberExpression(jscs.super(), jscs.identifier(fnName), false);
      superCall = jscs.callExpression(superMember, superArgs);
    }

    if (superCall) {
      jscs(path).replaceWith(superCall);
    }
  }
};

const replaceSuperclassWithSuper = (path, moduleName) => {
  // superClass_ -> fn -> "call" member -> call expression
  const callExpr = path.parent.parent.parent;
  const fnName = path.parent.value.property.name;
  const className = memberExpressionToString(path.value.object);
  if (className === moduleName) {
    // classes match, convert to super
    const superMember = jscs.memberExpression(jscs.super(), jscs.identifier(fnName), false);
    const superArgs = callExpr.value.arguments.slice(1);
    const superCall = jscs.callExpression(superMember, superArgs);
    jscs(callExpr).replaceWith(superCall);
  } else {
    logWithNode('warn', `Found superClass_ call to another class (${className}).`, path.value);
  }
};

/**
 * Replace all goog.provide statements with goog.module
 * @param {NodePath} root The root node.
 * @return {!Array<string>} List of modules in the file.
 */
const replaceProvidesWithModules = (root) => {
  const modules = [];
  const moduleExpressions = [];
  const findFn = createFindCallFn('goog.provide');
  root.find(jscs.CallExpression, findFn).forEach((path, idx, paths) => {
    const args = path.value.arguments;
    modules.push(args[0].value);

    const oldComments = path.parent.value.comments;

    // remove the goog.provide statement
    jscs(path).remove();

    // create the goog.module statement
    const googModuleExpr = jscs.expressionStatement(createCall('goog.module', args));
    if (oldComments) {
      googModuleExpr.comments = oldComments.map(c => jscs.commentBlock(c.value));
    }
    moduleExpressions.push(googModuleExpr);
  });

  if (moduleExpressions.length) {
    // include the legacy namespace statement for compatibility with old code
    moduleExpressions.push(jscs.expressionStatement(createCall('goog.module.declareLegacyNamespace', [])))

    // add the modules to the body
    const program = root.find(jscs.Program).get().value;
    program.body = moduleExpressions.concat(program.body);
  }

  return modules;
};

/**
 * Replace all goog.provide statements with goog.module
 * @param {NodePath} root The root node.
 * @param {string} controllerName The controller name.
 * @param {string} directiveName The directive name.
 * @return {string} The replaced module name.
 */
const replaceUIModules = (root, controllerName, directiveName) => {
  //
  // Try to create a unique module name using:
  //  - The controller name with 'Ctrl' replaced with 'UI'
  //  - The same name with 'UI' dropped
  //  - Append '_FixMe' and alert the developer
  //
  let moduleName = controllerName.replace(/Ctrl$/, 'UI');
  let existingDep = getDependency(moduleName);
  if (existingDep) {
    moduleName = moduleName.replace(/UI$/, '');

    existingDep = getDependency(moduleName);

    if (existingDep) {
      moduleName = `${moduleName}_FixMe`;
      logger.warn(`Couldn't create unique module name for ${moduleName}, please update.`);
    }
  }

  const findFn = createFindCallFn('goog.module');
  root.find(jscs.CallExpression, findFn).forEach((path, idx, paths) => {
    const args = path.value.arguments;
    if (args[0].value === directiveName) {
      jscs(path).remove();
    } else if (args[0].value === controllerName) {
      args[0] = jscs.literal(moduleName);
    }
  });

  return moduleName;
};

/**
 * Convert an Angular directive function.
 * @param {NodePath} root The root node path.
 * @param {NodePath} path The Closure class node path.
 * @param {string} moduleName The Closure module name.
 */
const convertDirective = (root, path, moduleName) => {
  const directiveBody = path.value.right.body;

  let arrowBody;
  let expression;
  if (directiveBody.body.length === 1 && directiveBody.body[0].type === 'ReturnStatement') {
    // return the directive object as a concise body
    arrowBody = directiveBody.body[0].argument;
    expression = false;
  } else {
    // use the original function body as a block body
    arrowBody = directiveBody;
    expression = true;
  }

  const directiveFn = jscs.arrowFunctionExpression([], arrowBody, expression);
  const varDeclarator = jscs.variableDeclarator(jscs.identifier(DIRECTIVE_NAME), directiveFn);
  const varDeclaration = jscs.variableDeclaration('const', [varDeclarator]);
  varDeclaration.comments = [jscs.commentBlock(path.parent.value.comments.pop().value)];

  jscs(path.parent).replaceWith(varDeclaration);

  // replace references to the fully qualified class name with the local class reference
  root.find(jscs.MemberExpression, createFindMemberExprObject(moduleName))
      .forEach(path => jscs(path).replaceWith(jscs.identifier(DIRECTIVE_NAME)));

  addExports(root, DIRECTIVE_NAME);

  const directiveCalls = root.find(jscs.CallExpression, (node) => {
    return node?.callee?.property?.name === 'directive' &&
        node.arguments.length === 2 &&
        node.arguments[0]?.type === 'Literal';
  });

  if (directiveCalls.length === 1) {
    const directiveCall = directiveCalls.get().value;
    const directiveName = String(directiveCall.arguments[0].value).replace(/([A-Z])/g, '-$1').toLowerCase();

    const tagDeclarator = jscs.variableDeclarator(jscs.identifier(DIRECTIVE_TAG_NAME), jscs.literal(directiveName));
    const tagDeclaration = jscs.variableDeclaration('const', [tagDeclarator]);
    tagDeclaration.comments = [jscs.commentBlock('*\n * The element tag for the directive.\n * @type {string}\n ')];
    jscs(path.parent).insertAfter(tagDeclaration);

    addExports(root, DIRECTIVE_TAG_NAME);
  }
};

/**
 * Convert a Closure interface to an ES6 class.
 * @param {NodePath} root The root node path.
 * @param {NodePath} path The Closure class node path.
 * @param {string} moduleName The Closure module name.
 */
const convertInterface = (root, path, moduleName) => {
  const interfaceName = path.value.left.property.name;

  // convert the interface to a class
  const classBody = jscs.classBody([]);
  const classDef = jscs.classDeclaration(jscs.identifier(interfaceName), classBody);
  classDef.comments = [jscs.commentBlock(path.parent.value.comments.pop().value)];
  jscs(path.parent).replaceWith(classDef);

  registerClassNode(moduleName, classDef);

  // move all prototype functions/properties to the class
  root.find(jscs.ExpressionStatement, {
    expression: {
      object: createFindMemberExprObject(`${moduleName}.prototype`)
    }
  }).forEach(path => convertPrototypeExpression(path, moduleName));

  // replace references to the fully qualified class name with the local class reference
  root.find(jscs.MemberExpression, createFindMemberExprObject(moduleName))
      .forEach(path => jscs(path).replaceWith(jscs.identifier(interfaceName)));

  addExports(root, interfaceName);
};

const isReassigned = (root, moduleName, propName) => {
  return root.find(jscs.AssignmentExpression, {
    left: {
      type: 'MemberExpression',
      object: createFindMemberExprObject(moduleName),
      property: {name: propName}
    }
  }).length > 1;
};

/**
 * Converts goog.define statements.
 *
 *  - Exports the value if the define is on a provided namespace.
 *  - Otherwise, assigns the value to a constant to reference locally. Value is not exported.
 *
 * @param {NodePath} root The root node path.
 * @param {NodePath} path The node path.
 * @param {!Array<string>} modules Modules detected in the file.
 */
const convertGoogDefine = (root, path, modules) => {
  const fullDefine = path.value.expression.arguments[0].value;
  const defineParts = fullDefine.split('.');
  const defineName = defineParts.pop();
  const defineNs = defineParts.join('.');

  if (modules.indexOf(defineNs) > -1) {
    // assign the define to "const <name> = <define>" and replace references in the file
    const defineIdentifier = jscs.identifier(defineName);
    const varDeclarator = jscs.variableDeclarator(defineIdentifier, path.value.expression || null);
    const varDeclaration = jscs.variableDeclaration('const', [varDeclarator]);

    // add the original comments and replace the node
    varDeclaration.comments = path.value.comments;
    jscs(path).replaceWith(varDeclaration);

    // replace references to the define with the exported value
    root.find(jscs.MemberExpression, createFindMemberExprObject(fullDefine))
        .forEach(path => jscs(path).replaceWith(defineIdentifier));

    // export the var
    addExports(root, [defineName]);
  } else {
    const localRefs = fullDefine.indexOf('.') > -1 ?
        // dot-delimited, find member expression
        root.find(jscs.MemberExpression, createFindMemberExprObject(fullDefine)) :
        // find identifier
        root.find(jscs.Identifier, {name: fullDefine});

    if (localRefs.length) {
      //
      // prefix with _ to avoid matching a duplicate define name on another namespace (ex: ROOT + os.ROOT).
      //
      const varName = getUniqueVarName(root, fullDefine, '_');
      const varIdentifier = jscs.identifier(varName);
      const varDeclarator = jscs.variableDeclarator(varIdentifier, path.value.expression);
      const varDeclaration = jscs.variableDeclaration('const', [varDeclarator]);
      varDeclaration.comments = path.value.comments;

      jscs(path).replaceWith(varDeclaration);

      // replace references to the define with the variable
      localRefs.forEach(path => jscs(path).replaceWith(varIdentifier));
    }
  }
};

const convertNamespaceExpression = (root, path, moduleName) => {
  const expression = path.value.expression;
  const isAssignment = expression.type === 'AssignmentExpression';
  const propName = isAssignment ? expression.left.property.name :
      path.value.expression.property.name;
  const isPrivateExpr = isPrivate(path.value);

  const kind = isAssignment && !isReassigned(root, moduleName, propName) ? 'const' : 'let';
  const varDeclarator = jscs.variableDeclarator(jscs.identifier(propName), expression.right || null);
  const varDeclaration = jscs.variableDeclaration(kind, [varDeclarator]);

  if (path.value.comments) {
    // these annotations are assumed within a module
    const newComment = path.value.comments.pop().value
      .replace('\n * @const', '')
      .replace('\n * @private', '');

    varDeclaration.comments = [jscs.commentBlock(newComment)];
  }

  jscs(path).replaceWith(varDeclaration);

  // replace references to the fully qualified class name with the local class reference
  root.find(jscs.MemberExpression, createFindMemberExprObject(`${moduleName}.${propName}`))
      .forEach(path => jscs(path).replaceWith(jscs.identifier(propName)));

  if (!isPrivateExpr) {
    addExports(root, [propName]);
  }
};

/**
 * Convert a Closure class to an ES6 class.
 * @param {NodePath} root The root node path.
 * @param {NodePath} path The Closure class node path.
 * @param {string} moduleName The Closure module name.
 */
const convertClass = (root, path, moduleName) => {
  const isController = isControllerClass(path.parent.value);
  const className = isController ? CONTROLLER_NAME : path.value.left.property.name;

  const ctorFn = jscs.functionExpression(null, path.value.right.params, path.value.right.body);
  const ctor = jscs.methodDefinition('constructor', jscs.identifier('constructor'), ctorFn);
  const classBody = jscs.classBody([ctor]);
  const classDef = jscs.classDeclaration(jscs.identifier(className), classBody);

  const comments = path.parent.value.comments;
  if (comments && comments.length) {
    const classComments = splitCommentsForClass(comments.pop().value);
    if (isController) {
      classComments.body = classComments.body.replace(/ *$/, ' * @unrestricted\n ');
    }
    classDef.comments = [jscs.commentBlock(classComments.body)];
    ctor.comments = [jscs.commentBlock(classComments.ctor)];
  }

  jscs(path.parent).replaceWith(classDef);

  registerClassNode(moduleName, classDef);

  // move all prototype functions/properties to the class
  root.find(jscs.AssignmentExpression, {
    left: {
      type: 'MemberExpression',
      object: createFindMemberExprObject(`${moduleName}.prototype`)
    }
  }).forEach(path => convertPrototypeAssignment(path, moduleName));

  // replace all <class>.base calls with super
  root.find(jscs.CallExpression, createFindCallFn(`${moduleName}.base`))
      .forEach(path => replaceBaseWithSuper(path, moduleName));

  // replace all <class>.superClass_ calls with super
  root.find(jscs.MemberExpression, createFindMemberExprObject(`superClass_`))
      .forEach(path => replaceSuperclassWithSuper(path, moduleName));

  // move all static properties to the class
  root.find(jscs.AssignmentExpression, {
    left: {
      type: 'MemberExpression',
      object: createFindMemberExprObject(moduleName)
    }
  }).forEach(path => convertStaticProperty(root, path, moduleName));

  //
  // move goog.addSingletonGetter to static getInstance/setInstance functions on the class
  //
  // this is config-driven because the static getInstance is not compatible with a parent class using
  // goog.addSingletonGetter.
  //
  if (config.get('replaceSingletons')) {
    root.find(jscs.CallExpression, {
      callee: createFindMemberExprObject('goog.addSingletonGetter'),
      arguments: [createFindMemberExprObject(moduleName)]
    }).forEach(path => moveSingletonToClass(path, moduleName));
  }

  // move goog.inherits to class extends keyword
  root.find(jscs.CallExpression, {
    callee: createFindMemberExprObject('goog.inherits'),
    arguments: [createFindMemberExprObject(moduleName)]
  }).forEach(path => moveInheritsToClass(path, moduleName));

  // replace references to the fully qualified class name with the local class reference
  root.find(jscs.MemberExpression, createFindMemberExprObject(moduleName))
      .forEach(path => jscs(path).replaceWith(jscs.identifier(className)));

  // add exports statement for the class
  addExports(root, className);
};

module.exports = {
  addMethodToClass,
  addStaticGetToClass,
  convertGoogDefine,
  convertNamespaceExpression,
  convertClass,
  convertDirective,
  convertInterface,
  replaceProvidesWithModules,
  replaceUIModules,
  splitCommentsForClass
};
