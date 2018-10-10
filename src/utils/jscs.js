const jscs = require('jscodeshift');

/**
 * Bind a callback argument to a `this` argument.
 * @param {Array} args The arguments.
 * @return {Array} The arguments, with the callback bound.
 */
const bindArgs = args => {
  if (args.length === 3) {
    // if a third argument was passed to goog.array.find, bind the compare function to it
    const bindExpression = jscs.memberExpression(args[1], jscs.identifier('bind'));
    const callExpression = jscs.callExpression(bindExpression, [args[2]]);
    args = [args[0], callExpression];
  }

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

module.exports = {
  bindArgs: bindArgs,
  createCall: createCall
}
