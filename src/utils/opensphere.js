const jscs = require('jscodeshift');
const jscsUtils = require('./jscs');

const {replaceLegacyRequire} = require('./goog');


/**
 * require -- the module/provide that should be in the goog.require(). null/undefined uses the string key
 * singleton -- true to append .getInstance() to uses of the const. null/undefined is the same as false
 * 
 * @typedef {{
 *   require: (string|null|undefined),
 *   singleton: (boolean|null|undefined)
 * }}
 */
let OSGlobalTransformConfig;

/**
 * @type {Object<String, OSGlobalTransformConfig>}
 */
const osGlobals_ = {
  'os.alertManager': {'require': 'os.alert.AlertManager', 'singleton': true},
  'os.feature': {},
  'os.geo': {},
  'os.ui': {},
  'os.settings': {'require': 'os.config.Settings', 'singleton': true},
  'os.MapContainer': {}
};

/**
 * Utility function to update/append globals from command-line configs
 * 
 * @param {Object<String, OSGlobalTransformConfig>} globals 
 */
const addOSGlobals = (globals) => {
  Object.assign(osGlobals_, globals);
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
    replaceLegacyRequire(root, key, config.require, (config.singleton === true));
  }
};

module.exports = {
  addOSGlobals,
  isOSGlobal,
  convertOSGlobal,
  OSGlobalTransformConfig
};
