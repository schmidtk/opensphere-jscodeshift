const jscs = require('jscodeshift');
const {createFindCallFn} = require('./ast');
const googUtil = require('./goog');
const {getDefaultSourceOptions} = require('./options');

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
  const memberExpression = createMemberExpression(path);
  return jscs.callExpression(memberExpression, args);
};


/**
 * Create a member expression from a dot-delimited path (`ol.array.find`), or array of strings.
 * @param {string|Array<string>} path The call path.
 * @return {Node} The member expression node.
 */
const createMemberExpression = (path) => {
  const pathParts = Array.isArray(path) ? path : path.split('.');
  return pathParts.reduce((expr, current, idx, arr) => {
    if (arr.length > idx + 1) {
      if (!expr) {
        expr = jscs.memberExpression(jscs.identifier(arr[idx]), jscs.identifier(arr[idx + 1]));
      } else {
        expr = jscs.memberExpression(expr, jscs.identifier(arr[idx + 1]));
      }
    }

    return expr;
  }, undefined);
};

/**
 * Convert a MemberExpression node to a string.
 * @param {Node} node The node.
 * @return {string} The member expression string.
 */
const memberExpressionToString = (node) => {
  const parts = [];
  while(node.type === 'MemberExpression') {
    parts.push(node.property.name);
    node = node.object;
  }

  if (node.type === 'Identifier') {
    parts.push(node.name);
  }

  return parts.reverse().join('.');
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

/**
 * Print source code and fix whitespace issues with recast's printer.
 * @param {Node} root The root node.
 * @return {string} The printed source.
 */
const printSource = (root) => {
  let output = root.toSource(getDefaultSourceOptions()).trim();

  const lastRequire = output.lastIndexOf('goog.require');

  // after the legacy namespace call, add one blank line if there are require statements, two blank lines if not
  const linesAfterLegacyNs = lastRequire > -1 ? '\n\n' : '\n\n\n';
  output = output.replace(/goog\.module\.declareLegacyNamespace\(\);[\n]*/, `goog.module.declareLegacyNamespace();${linesAfterLegacyNs}`);

  // add two blank lines between the last require and the rest of the content
  if (lastRequire > -1) {
    const nextNewline = output.indexOf('\n', lastRequire);
    if (nextNewline > -1) {
      const before = output.slice(0, nextNewline).trim();
      const after = output.slice(nextNewline).trim();
      output = `${before}\n\n\n${after}`;
    }
  }

  // add trailing newline
  return `${output}\n`;
};

module.exports = {
  bindArgs,
  createCall,
  createMemberExpression,
  memberExpressionToString,
  printSource,
  replaceFunction
}
