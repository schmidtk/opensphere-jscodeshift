const jscs = require('jscodeshift');

const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

const {
  removeLegacyNamespace,
  replaceModuleExportsWithEs6,
  replaceModuleWithDeclareModuleId
} = require('../../utils/goog');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  //
  // Flip this to true if default exports need to be shimmed for backward compatibility.
  //
  // https://github.com/google/closure-compiler/wiki/Migrating-from-goog.modules-to-ES6-modules
  //
  const shimDefault = false;

  // Replace goog.module statement with goog.declareModuleId. Only continue if a module was found.
  const moduleName = replaceModuleWithDeclareModuleId(root, shimDefault);
  if (moduleName) {
    // Replace goog 'exports' with ES6 export statements.
    replaceModuleExportsWithEs6(root, moduleName);

    // Remove goog.module.declareLegacyNamespace, if present.
    removeLegacyNamespace(root);

    return printSource(root);
  }

  return file.source;
};
