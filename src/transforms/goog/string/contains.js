/**
 * @file Replaces `goog.string.contains` calls with `theString.indexOf(value) != -1`.
 */

const jscs = require('jscodeshift');
const callToBinary = require('../../../utils/calltobinary');
const sourceOptions = require('../../../utils/sourceoptions');

/**
 * If a node is a `goog.string.contains` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isStringContains = node => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: {
      object: {
        object: {
          name: 'goog'
        },
        property: {name: 'string'}
      },
      property: {name: 'contains'}
    }
  });
};

/**
 * Get the left side of the binary expression.
 * @param {NodePath} path The call expression node.
 * @param {Object} options The BinaryExpression options.
 * @return {Node|undefined} The AST node for the left side of the binary expression.
 */
const getLeftSide = (path, options) => {
  const args = path.value.arguments;
  if (args && args.length === 2) {
    const bindExpression = jscs.memberExpression(args[0], jscs.identifier('indexOf'));
    return jscs.callExpression(bindExpression, [args[1]]);
  }

  return undefined;
};

/**
 * Replace `goog.string.contains` with `theString.indexOf(value) != -1`.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = callToBinary(file, isStringContains, {
    expression: '!=',
    notExpression: '==',
    leftSide: getLeftSide,
    rightSide: jscs.literal(-1)
  });

  // print
  return root.toSource(sourceOptions);
};
