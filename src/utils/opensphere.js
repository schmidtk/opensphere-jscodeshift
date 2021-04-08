const fs = require('fs');
const jscs = require('jscodeshift');
const jscsUtils = require('./jscs');
const {addVarName} = require('./ast');
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
let osGlobals_ = {};

/**
 * Utility function to update/append globals from command-line configs
 *
 * @param {Object<String, OSGlobalTransformConfig>} globals
 * @param {?boolean} opt_replace
 */
const addOSGlobals = (globals, opt_replace) => {
  if (opt_replace === true) osGlobals_ = globals;
  else Object.assign(osGlobals_, globals);
};

/**
 * @param {Node} node The node.
 * @return {boolean}
 */
const isOSGlobal = (node) => {
  const isExpression = (node.type === jscs.MemberExpression.name);
  const b = (isExpression && isOSGlobalKey(jscsUtils.memberExpressionToString(node)));
  return b;
};

/**
 * @param {string} key The expression string.
 * @return {boolean}
 */
const isOSGlobalKey = (key) => {
  return (!!osGlobals_[key]);
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

// on creation, read ".jscodeshift.json" file(s) from this folder and sibling folders
// TODO move this to a new, "settings" module someday
(function(){
  const workspace = '../'; // relative from the npm run -- not this file
  const filename = '.jscodeshift.json';
  fs.readdirSync(workspace).forEach((folder) => {
    const filepath = `${workspace}${folder}/${filename}`;
    if (fs.existsSync(filepath)) {
      const config = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      if (config) {
        if (config.globals) {
          addOSGlobals(config.globals);
        }
        if (config.moduleVarNames) {
          for (const key in config.moduleVarNames) {
            addVarName(key, config.moduleVarNames[key]);
          }
        }
      }
    }
  });
})();


module.exports = {
  addOSGlobals,
  isOSGlobal,
  isOSGlobalKey,
  convertOSGlobal,
  OSGlobalTransformConfig
};
