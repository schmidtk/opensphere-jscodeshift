/**
 * @file Replaces `goog.array.forEach` calls with `Array#forEach`.
 */

const jscs = require('jscodeshift');

/**
 * If a node is a `goog.array.forEach` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isArrayForEach = node => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: {
      object: {
        object: {
          name: 'goog'
        },
        property: {name: 'array'}
      },
      property: {name: 'forEach'}
    }
  });
};

/**
 * Replace `goog.array.forEach` with `Array#forEach`.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  root.find(jscs.CallExpression, isArrayForEach).forEach(path => {
    const args = path.value.arguments;
    if (args && args.length >= 2) {
      const forEachExpr = jscs.memberExpression(args[0], jscs.identifier('forEach'));
      const forEachCall = jscs.callExpression(forEachExpr, args.slice(1));
      jscs(path).replaceWith(forEachCall);
    }
  });

  return root.toSource();
};
