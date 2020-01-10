/**
 * @file Replaces `goog.array` calls with equivalent `ol.array` calls.
 */

const jscs = require('jscodeshift');
const jscsUtil = require('../../../utils/jscs');
const {getDefaultSourceOptions} = require('../../../utils/sourceoptions');

/**
 * Replace `goog.array` calls with equivalent `ol.array` calls.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  jscsUtil.replaceFunction(root, {
    replace: 'goog.array.contains',
    with: 'ol.array.includes',
    requiredArgs: 2,
    googRequire: 'ol.array'
  });

  jscsUtil.replaceFunction(root, {
    replace: 'goog.array.find',
    with: 'ol.array.find',
    bindArgs: [1, 2],
    requiredArgs: 2,
    googRequire: 'ol.array'
  });

  jscsUtil.replaceFunction(root, {
    replace: 'goog.array.findIndex',
    with: 'ol.array.findIndex',
    bindArgs: [1, 2],
    requiredArgs: 2,
    googRequire: 'ol.array'
  });

  jscsUtil.replaceFunction(root, {
    replace: 'goog.array.remove',
    with: 'ol.array.remove',
    googRequire: 'ol.array'
  });

  return root.toSource(getDefaultSourceOptions());
};
