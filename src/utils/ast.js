const jscs = require('jscodeshift');


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
 * If a variable name is declared within the file.
 * @param {NodePath} root The root node.
 * @param {string} varName The variable name.
 * @return {boolean} If the variable is declared in the file.
 */
const hasVar = (root, varName) => {
  return root.find(jscs.VariableDeclarator, {id: {name: varName}}).length > 0;
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
  hasVar,
  isCall,
  replaceFunctionExpressionWithArrow
};
