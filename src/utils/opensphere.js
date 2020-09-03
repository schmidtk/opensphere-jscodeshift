const jscs = require('jscodeshift');
const jscsUtils = require('./jscs');

const {replaceLegacyRequire} = require('./goog');

const osGlobals_ = {
  'os.alertManager': {'require': 'os.alert.AlertManager', 'singleton': true},
  'os.feature': {'singleton': false},
  'os.geo': {'singleton': false},
  'os.ui': {'singleton': false},
  'os.settings': {'require': 'os.config.Settings', 'singleton': true},
  'os.MapContainer': {'singleton': false}
};

/**
 * @param {Node} node The node.
 * @return {boolean}
 */
const isOSGlobal = (node) => {
  const isExpression = (node.type === jscs.MemberExpression.name);
  const b = (isExpression && !!osGlobals_[jscsUtils.memberExpressionToString(node)]);
  return b;
};

/**
 * Swap out the opensphere global(s) in this path, e.g. os.ui.apply(...)
 * if not already added, add get variable name and require it to the modules, e.g. const osUI = goog.require('os.ui');
 * replace all calls with the new variable name, e.g. osUI.apply(...)
 * 
 * @param {NodePath} root The root node path.
 * @param {NodePath} path The node path.
 * @param {!Array<string>} modules Modules detected in the file.
 */
const convertOSGlobal = (root, path, modules) => {
  const key = jscsUtils.memberExpressionToString(path.value);
  const config = osGlobals_[key];

  if (config) {
    replaceLegacyRequire(root, key, config.require, config.singleton);
  }
};

module.exports = {
  isOSGlobal,
  convertOSGlobal
};
