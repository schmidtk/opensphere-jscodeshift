const fs = require('fs');
const jscs = require('jscodeshift');
const jscsUtils = require('./jscs');
const {addVarName} = require('./ast');
const {
  addLegacyRequire,
  getDependency,
  getGlobalRefs,
  isModuleFile,
  isGoogRequire,
  replaceSrcGlobals,
  replaceTestGlobals,
  replaceLegacyRequire
} = require('./goog');
const {isKarmaTest} = require('./karma');
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
  return Object.prototype.hasOwnProperty.call(osGlobals_, key);
};

/**
 * Convert global references in a file.
 * @param {NodePath} root The root node path.
 */
const convertGlobalRefs = (root) => {
  const isModule = isModuleFile(root);
  const isTestFile = isKarmaTest(root);

  // Only handle modules (goog or ES) and test files.
  if (isModule || isTestFile) {
    // First replace OS globals because they may otherwise be detected under the wrong module.
    root.find(jscs.MemberExpression, isOSGlobal).forEach(path => {
      convertOSGlobal(root, path);
    });

    globalRootNamespaces.forEach((ns) => {
      const globalDeps = getGlobalRefs(root, ns)
          .map((globalRef) => {
            const dep = getDependency(globalRef, true);
            if (dep && dep.moduleName) {
              return dep;
            }

            if (!moduleBlacklist.includes(globalRef)) {
              logger.warn(`Unable to locate module for global reference ${globalRef}`);
            }

            return null;
          })
          .filter((d, index, self) => d && d.moduleName && !moduleBlacklist.includes(d.moduleName) && self.indexOf(d) === index)
          .sort((a, b) => a.moduleName > b.moduleName ? -1 : a.moduleName < b.moduleName ? 1 : 0);

      globalDeps.forEach((dep) => {
        if (dep && dep.moduleName) {
          // Test files use a legacy goog.require with goog.module.get to actually reference the module, so they need to
          // be handled differently.
          if (isTestFile) {
            replaceTestGlobals(root, dep.moduleName);
          } else {
            replaceSrcGlobals(root, dep.moduleName);
          }
        }
      });
    });
  }
};

/**
 * Replace all legacy goog.require statements found in the root node.
 * @param {Node} root The root node.
 */
const convertLegacyRequires = (root) => {
  const requireStatements = root.find(jscs.ExpressionStatement, isGoogRequire);
  const unusedRequires = [];
  requireStatements.paths().reverse();
  requireStatements.forEach(path => {
    const requireVarName = path.value.expression.arguments[0].value;
    if (path.parent.value.type === 'Program' && !isOSGlobalKey(requireVarName)) {
      const replacedIdentifier = replaceLegacyRequire(root, requireVarName);
      if (!replacedIdentifier) {
        unusedRequires.push(requireVarName);
      }
    }
  });

  if (unusedRequires.length) {
    // Add the legacy goog.require statement back. This may be a directive used by the template, implicit require,
    // etc that should be manually updated by a developer.
    unusedRequires.forEach((req) => {
      addLegacyRequire(root, req);
    });

    logger.warn(`Found ${unusedRequires.length} legacy require statements that need verification.`);
  }
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
  if (isOSGlobalKey(key)) {
    const config = osGlobals_[key];
    if (config) {
      replaceLegacyRequire(root, key, config.require, (config.singleton === true));
    }
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
  convertLegacyRequires,
  convertOSGlobal,
  OSGlobalTransformConfig
};
