/**
 * @file Replaces `goog.bind` calls with `Function#bind`.
 */

const jscs = require('jscodeshift');

/**
 * If a node is a `goog.bind` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogBind = function(node) {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'bind'}
    }
  });
};

/**
 * Replace `goog.bind` with `Function#bind`.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  root.find(jscs.CallExpression, isGoogBind).forEach(path => {

  });

  return root.toSource();
};
