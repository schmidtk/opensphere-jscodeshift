/**
 * @file Replaces `goog.array` calls with equivalent `os.array` calls.
 */

const jscs = require('jscodeshift');
const jscsUtil = require('../../../utils/jscs');
const {getDefaultSourceOptions} = require('../../../utils/options');

/**
 * Replace `goog.array.forEach` with `Array#forEach`.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  jscsUtil.replaceFunction(root, {
    replace: 'goog.array.forEach',
    with: 'os.array.forEach',
    requiredArgs: 2,
    googRequire: 'os.array'
  });

  jscsUtil.replaceFunction(root, {
    replace: 'goog.array.clear',
    with: 'os.array.clear',
    requiredArgs: 1,
    googRequire: 'os.array'
  });

  return root.toSource(getDefaultSourceOptions());
};
