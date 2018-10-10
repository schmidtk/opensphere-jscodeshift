/**
 * @file Replaces `goog.array.find` calls with `ol.array.find`.
 */

const jscs = require('jscodeshift');
const googRequires = require('../../../utils/googrequire');
const jscsUtil = require('../../../utils/jscs');

/**
 * If a node is a `goog.array.find` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isArrayFind = node => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: {
      object: {
        object: {name: 'goog'},
        property: {name: 'array'}
      },
      property: {name: 'find'}
    }
  });
};

/**
 * If a node is a `goog.array.find` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isArrayFindIndex = node => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: {
      object: {
        object: {name: 'goog'},
        property: {name: 'array'}
      },
      property: {name: 'findIndex'}
    }
  });
};

/**
 * Replace `goog.array.find` with `ol.array.find`.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  let replacedOne = false;

  root.find(jscs.CallExpression, isArrayFind).forEach(path => {
    const args = jscsUtil.bindArgs(path.value.arguments);
    if (args && args.length === 2) {
      jscs(path).replaceWith(jscsUtil.createCall('ol.array.find', args));
      replacedOne = true;
    }
  });

  root.find(jscs.CallExpression, isArrayFindIndex).forEach(path => {
    const args = jscsUtil.bindArgs(path.value.arguments);
    if (args && args.length === 2) {
      jscs(path).replaceWith(jscsUtil.createCall('ol.array.findIndex', args));
      replacedOne = true;
    }
  });

  if (replacedOne) {
    googRequires.add(root, 'ol.array');
  }

  return root.toSource({quote: 'single'});
};
