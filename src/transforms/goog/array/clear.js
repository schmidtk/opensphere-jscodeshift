/**
 * @file Replaces `goog.array.clear` calls with `theArray.length = 0`.
 */

const jscs = require('jscodeshift');

/**
 * If a node is a `goog.array.clear` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isArrayClear = node => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: {
      object: {
        object: {
          name: 'goog'
        },
        property: {name: 'array'}
      },
      property: {name: 'clear'}
    }
  });
};

/**
 * Replace `goog.array.clear` with `theArray.length = 0`.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  root.find(jscs.CallExpression, isArrayClear).forEach(path => {
    const args = path.value.arguments;
    if (args && args.length === 1) {
      const arrayLength = jscs.memberExpression(args[0], jscs.identifier('length'));
      const assignment = jscs.assignmentExpression('=', arrayLength, jscs.literal(0));
      jscs(path).replaceWith(assignment);
    }
  });

  return root.toSource();
};
