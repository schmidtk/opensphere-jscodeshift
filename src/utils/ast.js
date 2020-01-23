const jscs = require('jscodeshift');
const camelcase = require('camelcase');


/**
 * Native identifiers to avoid shadowing with a variable.
 * @type {!Array<string>}
 * @const
 */
const NATIVE_IDENTIFIERS = [
  // Types
  'Array',
  'Boolean',
  'Function',
  'Number',
  'Object',
  'String',

  // null/undefined
  'null',
  'undefined',

  // ES6 constructs
  'Map',
  'Set'
];


/**
 * Create a Node find function to locate a call expression by path (ie, `goog.array.find`).
 * @param {string} path The call function path.
 * @return {function(Node):boolean}
 */
const createFindCallFn = path => {
  return node => node.type === 'CallExpression' && jscs.match(node, {callee: createFindMemberExprObject(path)});
};


/**
 * Create an object to find a member expression.
 * @param {string} memberPath The dot delimited member expression path.
 * @return {Object}
 */
const createFindMemberExprObject = (memberPath) => {
  const pathParts = Array.isArray(memberPath) ? memberPath : memberPath.split('.');
  return pathParts.reduce((obj, current, idx, arr) => {
    if (!obj) {
      if (arr.length > idx + 1) {
        obj = {
          object: {name: arr[idx]},
          property: {name: arr[idx + 1]}
        };
      } else {
        obj = {
          property: {name: arr[idx]}
        }
      }
    } else if (arr.length > idx + 1) {
      obj = {
        object: obj,
        property: {name: arr[idx + 1]}
      };
    }

    return obj;
  }, undefined);
};


/**
 * Create a var name from a list of parts.
 * @param {!Array<string>} parts The parts. These will be combined in camelcase.
 * @param {string|undefined} prefix The prefix to add.
 * @param {string|undefined} suffix The suffix to add.
 * @return {string} The var name.
 */
const getVarName = (parts, prefix, suffix) => {
  prefix = prefix || '';
  suffix = suffix || '';

  //
  // If only one part is provided, use it. Otherwise combine them in camelcase.
  //
  const baseName = parts.length === 1 ? parts[0] : camelcase(parts.join('-'));

  return `${prefix}${baseName}${suffix}`;
};


/**
 * Get a unique variable name to use within the scope of the provided path.
 * @param {NodePath} root The scope's node path.
 * @param {string} originalName The original dot-delimited name.
 * @param {string|undefined} prefix Prefix for the variable name.
 * @return {string} The variable name.
 */
const getUniqueVarName = (root, originalName, prefix) => {
  const moduleParts = originalName.split('.');
  prefix = prefix || '';

  // try the last part of the module name first
  let varName = `${prefix}${moduleParts[moduleParts.length - 1]}`;

  // if that doesn't work, camelcase the parts
  if (hasVar(root, varName)) {
    varName = getVarName(moduleParts, prefix);
  }

  // if that still doesn't work, add a counter
  let i = 1;
  while (hasVar(root, varName)) {
    varName = getVarName(moduleParts, prefix, i++);
  }

  return varName;
};


/**
 * If a variable name is declared within the file.
 * @param {NodePath} root The root node.
 * @param {string} varName The variable name.
 * @return {boolean} If the variable is declared in the file.
 */
const hasVar = (root, varName) => {
  return NATIVE_IDENTIFIERS.indexOf(varName) > -1 ||
      root.find(jscs.VariableDeclarator, {id: {name: varName}}).length > 0;
};


/**
 * If a node represents a CallExpression for the provided function.
 * @param {Node} node The node.
 * @param {string} fn The full function name.
 * @return {boolean}
 */
const isCall = (node, fn) => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: createFindMemberExprObject(fn)
  });
};


/**
 * Replace a function expression with an arrow function.
 * @param {Node} node The node.
 */
const replaceFunctionExpressionWithArrow = (node) => {
  if (node.type !== 'FunctionExpression') {
    return null;
  }

  // if the function body is a single return statement, make that the arrow function body
  let arrowBody;
  if (node.body.body.length === 1 && node.body.body[0].type === 'ReturnStatement') {
    arrowBody = node.body.body[0].argument;
  } else {
    arrowBody = node.body;
  }

  const arrowFn = jscs.arrowFunctionExpression(node.params, arrowBody, node.expression);
  arrowFn.comments = node.comments;

  return arrowFn;
};


module.exports = {
  createFindCallFn,
  createFindMemberExprObject,
  getUniqueVarName,
  hasVar,
  isCall,
  replaceFunctionExpressionWithArrow
};
