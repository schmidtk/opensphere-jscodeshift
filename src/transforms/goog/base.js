/**
 * @file Replaces `goog.array` calls with equivalent `os.array` calls.
 */

const jscs = require('jscodeshift');
const {addRequire, isGoogModuleFile, replaceSrcGlobals} = require('../../utils/goog');
const {replaceFunction, replaceMemberExpression} = require('../../utils/jscs');
const {getDefaultSourceOptions} = require('../../utils/options');

/**
 * Replace Closure functions from base.js with their suggested equivalent.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  replaceFunction(root, {
    replace: 'goog.nullFunction',
    with: 'os.fn.noop'
  });

  replaceMemberExpression(root, {
    replace: 'goog.nullFunction',
    with: 'os.fn.noop'
  });

  if (isGoogModuleFile(root)) {
    replaceSrcGlobals(root, 'os.fn');
  } else {
    addRequire(root, 'os.fn');
  }

  return root.toSource(getDefaultSourceOptions());
};
