/**
 * @file Replaces `goog.array` calls with equivalent `os.array` calls.
 */

const jscs = require('jscodeshift');
const {addRequire} = require('../../utils/goog');
const {replaceFunction, replaceMemberExpression} = require('../../utils/jscs');
const {getDefaultSourceOptions} = require('../../utils/options');

const replaceGoogNullFn = (root) => {
  const replacedFn = replaceFunction(root, {
    replace: 'goog.nullFunction',
    with: 'os.fn.noop'
  });

  const replacedMemberExpr = replaceMemberExpression(root, {
    replace: 'goog.nullFunction',
    with: 'os.fn.noop'
  });

  if (replacedFn || replacedMemberExpr) {
    addRequire(root, 'os.fn');
  }
};

/**
 * Replace Closure functions from base.js with their suggested equivalent.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  replaceGoogNullFn(root);

  return root.toSource(getDefaultSourceOptions());
};
