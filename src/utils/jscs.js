const jscs = require('jscodeshift');
const googUtil = require('./goog');

/**
 * Bind a callback argument to a `this` argument.
 * @param {Array} args The arguments.
 * @return {Array} The arguments, with the callback bound.
 */
const bindArgs = (args, indices) => {
  // assume the last two arguments are the callback and the "this" arg
  const bindExpression = jscs.memberExpression(args[indices[0]], jscs.identifier('bind'));
  const callExpression = jscs.callExpression(bindExpression, [args[indices[1]]]);
  args.length = args.length - 2;
  args.push(callExpression);

  return args;
};

/**
 * Create a call expression from a dot-delimited path (`ol.array.find`), or array of strings.
 * @param {string|Array<string>} path The call path.
 * @param {Array} args The call arguments.
 * @return {Node} The call expression node.
 */
const createCall = (path, args) => {
  const pathParts = Array.isArray(path) ? path : path.split('.');
  const memberExpression = pathParts.reduce((expr, current, idx, arr) => {
    if (arr.length > idx + 1) {
      if (!expr) {
        expr = jscs.memberExpression(jscs.identifier(arr[idx]), jscs.identifier(arr[idx + 1]));
      } else {
        expr = jscs.memberExpression(expr, jscs.identifier(arr[idx + 1]));
      }
    }

    return expr;
  }, undefined);

  return jscs.callExpression(memberExpression, args);
};

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
    if (arr.length > idx + 1) {
      if (!obj) {
        obj = {
          object: {name: arr[idx]},
          property: {name: arr[idx + 1]}
        };
      } else {
        obj = {
          object: obj,
          property: {name: arr[idx + 1]}
        };
      }
    }

    return obj;
  }, undefined);
};

/**
 * Replace a function call with another.
 * @param {Node} root The root node.
 * @param {Object} options The replace options.
 */
const replaceFunction = (root, options) => {
  const findFn = createFindCallFn(options.replace);
  root.find(jscs.CallExpression, findFn).forEach(path => {
    let args = path.value.arguments;
    if (options.bindArgs && args.length > options.bindArgs[1]) {
      args = bindArgs(path.value.arguments, options.bindArgs);
    }

    if (args && (!options.requiredArgs || args.length >= options.requiredArgs)) {
      jscs(path).replaceWith(createCall(options.with, args));

      if (options.googRequire) {
        googUtil.addRequire(root, options.googRequire);
      }
    }
  });
};

module.exports = {
  bindArgs: bindArgs,
  createCall: createCall,
  createFindCallFn: createFindCallFn,
  createFindMemberExprObject: createFindMemberExprObject,
  replaceFunction: replaceFunction
}
