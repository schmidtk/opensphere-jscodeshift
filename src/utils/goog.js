const jscs = require('jscodeshift');

const {createFindMemberExprObject, getUniqueVarName, isCall, isInComment, isReferenced, replaceInComments} = require('./ast');


/**
 * Regular expression to detect @const JSDoc annotation.
 * @type {RegExp}
 */
const CONST_REGEXP = /@const([\s]+.*)?/;


const getObjectProperty = (key, value) => {
  const property = jscs.property('init', jscs.identifier(key), value || jscs.identifier(key));
  property.shorthand = true;
  return property;
};


const getObjectProperties = (keys, values) => {
  return typeof keys === 'string' ? [getObjectProperty(keys, values)] :
      keys.map((key, idx, arr) => getObjectProperty(key, values ? values[idx] : undefined));
};


/**
 * Add exports to the source.
 * @param {NodePath} root The root node path.
 * @param {Array<string>|string} keys The export key(s). Use a string for default export, or array of strings for
 *                                    non-default exports.
 * @param {Array<Node>|Node} values Values to assign to the export(s).
 */
const addExports = (root, keys, values) => {
  const programs = root.find(jscs.Program);
  if (programs.length) {
    const program = programs.get().value;

    const existingAssignmentExpr = root.find(jscs.AssignmentExpression, {
      left: {type: 'Identifier', name: 'exports'}
    });

    let existingExports;
    if (existingAssignmentExpr.length) {
      existingExports = existingAssignmentExpr.get();

      // if the file is currently using a default export, convert it
      if (existingExports.value.right.type === 'Identifier') {
        const currentName = existingExports.value.right.name;
        existingExports.value.right = jscs.objectExpression([getObjectProperty(currentName)]);
      }
    }

    if (!existingExports && typeof keys === 'string' && !values) {
      // single default export
      const assignment = jscs.assignmentExpression('=', jscs.identifier('exports'), jscs.identifier(keys));
      program.body.push(jscs.expressionStatement(assignment));
    } else {
      // non-default exports
      const properties = getObjectProperties(keys, values);

      if (existingExports) {
        // add keys to existing exports
        const existingObjExpr = existingExports.value.right;
        existingObjExpr.properties = existingObjExpr.properties.concat(properties);
      } else {
        // create a new exports assignment
        const assignmentValue = jscs.objectExpression(properties);
        const assignment = jscs.assignmentExpression('=', jscs.identifier('exports'), assignmentValue);
        program.body.push(jscs.expressionStatement(assignment));
      }
    }
  }
};


/**
 * If a node is a `goog.module.declareLegacyNamespace` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogDeclareLegacyNamespace = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.module.declareLegacyNamespace');
};


/**
 * If a node is a `goog.define` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogDefine = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.define');
};


/**
 * If a node is a `goog.module` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogModule = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.module');
};


/**
 * If a node is a `goog.require` variable assignment.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogModuleRequire = node => {
  return node.type === 'VariableDeclaration' && jscs.match(node, {
    declarations: [{
      type: 'VariableDeclarator',
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.require')
      }
    }]
  });
};


/**
 * If a node is a `goog.requireType` variable assignment.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogModuleRequireType = node => {
  return node.type === 'VariableDeclaration' && jscs.match(node, {
    declarations: [{
      type: 'VariableDeclarator',
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.requireType')
      }
    }]
  });
};


/**
 * If a node is a `goog.array.find` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogRequire = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.require');
};


/**
 * If a node is a `goog.array.find` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogProvide = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.provide');
};


/**
 * If a node represents a Closure class constructor.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isClosureClass = node => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('@constructor') > -1;
  }
  return false;
};


/**
 * If a node represents a Closure class constructor.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isControllerClass = node => {
  if (isClosureClass(node)) {
    return node.comments[0].value.indexOf('@ngInject') > -1;
  }
  return false;
};


/**
 * If a node represents a Closure class constructor.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isDirective = node => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('angular.Directive') > -1;
  }
  return false;
};


/**
 * If a node represents an interface.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isInterface = node => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('@interface') > -1;
  }
  return false;
};


/**
 * If a node is marked constant in its comments.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isConst = (node) => {
  if (node && node.comments && node.comments.length === 1) {
    return CONST_REGEXP.test(node.comments[0].value);
  }
  return false;
};


/**
 * If a node is marked private in its comments.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isPrivate = (node) => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('@private') > -1;
  }
  return false;
};


/**
 * Add a goog.require statement if it doesn't already exist.
 * @param {Node} root The root node.
 * @param {string} toAdd The require to add.
 */
const addRequire = (root, toAdd) => {
  const requires = root.find(jscs.ExpressionStatement, isGoogRequire);
  if (!requires.some(path => path.node.expression.arguments[0].value === toAdd)) {
    const program = root.find(jscs.Program).get();
    const programBody = program.value.body;
    for (let i = 0; i < programBody.length; i++) {
      const current = programBody[i];
      if (!isGoogModule(current) && !isGoogDeclareLegacyNamespace(current) && !isGoogProvide(current) &&
          !isGoogModuleRequire(current) && !isGoogModuleRequireType(current)) {
        const insertIndex = isGoogRequire(current) ? i + 1 : i;
        const callee = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier('require'));
        const call = jscs.callExpression(callee, [jscs.literal(toAdd)]);
        programBody.splice(insertIndex, 0, jscs.expressionStatement(call));

        sortRequires(root);

        break;
      }
    }
  }
};


/**
 * Replace a legacy goog.require statement to use the module return value.
 * @param {Node} root The root node.
 * @param {string} toReplace The str to replace.
 * @param {?string} toReplaceAlt The str to require.
 * @param {?boolean} singleton if true, include getInstance() in call
 * @return {?string} The legacy require namespace, or null if replaced.
 */
const replaceLegacyRequire = (root, toReplace, toReplaceAlt, singleton) => {
  // remove existing goog.require calls for the module
  root.find(jscs.ExpressionStatement, {
    expression: {
      callee: createFindMemberExprObject('goog.require'),
      arguments: [{value: toReplace}]
    }
  }).remove();

  let requireCall;

  if (isReferenced(root, toReplace)) {
    // referenced in the file - use goog.require
    requireCall = 'require';
  } else if (isInComment(root, toReplace)) {
    // only referenced in comments - use goog.requireType
    requireCall = 'requireType';
  } else {
    // bail if the module isn't referenced in the file
    return toReplace;
  }

  // create a variable name that doesn't shadow any local vars
  let varName = getUniqueVarName(root, toReplace);

  // create the variable declaration
  const callee = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier(requireCall));
  const call = jscs.callExpression(callee, [jscs.literal(toReplaceAlt || toReplace)]);
  const varDeclarator = jscs.variableDeclarator(jscs.identifier(varName), call);
  const varDeclaration = jscs.variableDeclaration('const', [varDeclarator]);

  // insert the declaration after goog.module and legacy goog.require statements
  const program = root.find(jscs.Program).get();
  const programBody = program.value.body;
  for (let i = 0; i < programBody.length; i++) {
    const current = programBody[i];
    if (!isGoogModule(current) && !isGoogDeclareLegacyNamespace(current) && !isGoogProvide(current) && !isGoogRequire(current)) {
      programBody.splice(i, 0, varDeclaration);
      break;
    }
  }

  // add .getInstance() if needed for the in-line replacements
  if (singleton === true) varName = `${varName}.getInstance()`;

  // replace references to the fully qualified class name with the local variable name
  root.find(jscs.MemberExpression, createFindMemberExprObject(toReplace))
      .forEach(path => jscs(path).replaceWith(jscs.identifier(varName)));

  // replace references in comments
  replaceInComments(root, toReplace, varName);

  return null;
};


/**
 * Sort goog.require statements.
 * @param {Node} root The root node.
 */
const sortRequires = root => {
  const requires = root.find(jscs.ExpressionStatement, isGoogRequire)
      .nodes()
      .map(node => node.expression.arguments[0].value)
      .sort();

  root.find(jscs.ExpressionStatement, isGoogRequire).forEach((path, idx, arr) => {
    const callee = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier('require'));
    const call = jscs.callExpression(callee, [jscs.literal(requires[idx])]);
    jscs(path).replaceWith(jscs.expressionStatement(call));
  });
};


/**
 * Get the sort value for two goog.require/goog.requireType variable declarations.
 * @param {Node} a The first node.
 * @param {Node} b The second node.
 * @return {number} The sort value. Sorts goog.require above goog.requireType, then by required namespace.
 */
const sortModuleRequires_ = (a, b) => {
  const aIsRequire = a.declarations[0].init.callee.property.name === 'require';
  const bIsRequire = b.declarations[0].init.callee.property.name === 'require';

  if (aIsRequire === bIsRequire) {
    const aNamespace = a.declarations[0].init.arguments[0];
    const bNamespace = b.declarations[0].init.arguments[0];
    return aNamespace > bNamespace ? -1 : aNamespace < bNamespace ? 1 : 0
  }

  return aIsRequire ? -1 : 1;
};


/**
 * Sort goog.require variable declarations.
 * @param {Node} root The root node.
 */
const sortModuleRequires = root => {
  const requires = root.find(jscs.VariableDeclaration,
      (node) => isGoogModuleRequire(node) || isGoogModuleRequireType(node));
  if (requires.length) {
    const requireNodes = requires.nodes().slice().sort(sortModuleRequires_);
    requires.forEach((path, idx, arr) => {
      jscs(path).replaceWith(requireNodes[idx]);
    });
  }
};


module.exports = {
  addExports,
  addRequire,
  isGoogDeclareLegacyNamespace,
  isGoogDefine,
  isGoogModule,
  isGoogProvide,
  isGoogRequire,
  isGoogModuleRequire,
  isGoogModuleRequireType,
  isClosureClass,
  isControllerClass,
  isDirective,
  isInterface,
  isConst,
  isPrivate,
  replaceLegacyRequire,
  sortRequires,
  sortModuleRequires
};
