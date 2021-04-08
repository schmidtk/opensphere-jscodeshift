const fs = require('fs');
const jscs = require('jscodeshift');
const jscsUtils = require('./jscs');
const {addVarName} = require('./ast');
const {
  isKarmaTest,
  getDependency,
  getGlobalRefs,
  replaceSrcGlobals,
  replaceTestGlobals,
  replaceLegacyRequire
} = require('./goog');
const {logger} = require('./logger');


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
 * Root namespaces that should be detected for global references.
 * @type {Array<string>}
 */
let globalRootNamespaces = [];

/**
 * Modules that should not be assigned a global reference.
 * @type {Array<string>}
 */
let moduleBlacklist = [];

/**
 * Add modules to the global reference blacklist.
 * @param {Array<string>} modules The modules.
 */
const addBlacklistModules = (modules) => {
  if (modules && modules.length) {
    moduleBlacklist = [...new Set(moduleBlacklist.concat(modules))];
  }
};

/**
 * Add root namespaces to be detected for global references.
 * @param {Array<string>} namespaces The namespaces.
 */
const addGlobalRootNamespaces = (namespaces) => {
  if (namespaces && namespaces.length) {
    globalRootNamespaces = [...new Set(globalRootNamespaces.concat(namespaces))];
  }
};

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
 * Convert global references in a file.
 * @param {NodePath} root The root node path.
 */
const convertGlobalRefs = (root) => {
  const isTestFile = isKarmaTest(root);

  // In source files, first replace OS globals because they may otherwise be detected under the wrong module.
  // This is not yet supported in tests.
  if (!isTestFile) {
    root.find(jscs.MemberExpression, isOSGlobal).forEach(path => {
      convertOSGlobal(root, path);
    });
  }

  globalRootNamespaces.forEach((ns) => {
    getGlobalRefs(root, ns).forEach((globalRef) => {
      const dependency = getDependency(globalRef, true);
      if (dependency && dependency.moduleName) {
        if (moduleBlacklist.includes(dependency.moduleName)) {
          // Ignore modules in the blacklist.
          return;
        }

        // Test files use a legacy goog.require with goog.module.get to actually reference the module, so they need to
        // be handled differently.
        if (isTestFile) {
          replaceTestGlobals(root, dependency.moduleName);
        } else {
          replaceSrcGlobals(root, dependency.moduleName);
        }
      } else {
        logger.warn(`Unable to locate module for global reference ${globalRef}`);
      }
    });
  });
};

/**
 * Swap out the opensphere global(s) in this path, e.g. os.ui.apply(...)
 * if not already added, add get variable name and require it to the modules, e.g. const osUI = goog.require('os.ui');
 * replace all calls with the new variable name, e.g. osUI.apply(...)
 *
 * @param {NodePath} root The root node path.
 * @param {NodePath} path The node path.
 */
const convertOSGlobal = (root, path) => {
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

        if (config.globalRootNamespaces) {
          addGlobalRootNamespaces(config.globalRootNamespaces);
        }

        if (config.moduleBlacklist) {
          addBlacklistModules(config.moduleBlacklist);
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
  convertGlobalRefs,
  convertOSGlobal,
  OSGlobalTransformConfig
};
