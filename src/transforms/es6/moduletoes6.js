const jscs = require('jscodeshift');

const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

const {
  removeLegacyNamespace,
  replaceModuleExportsWithEs6,
  replaceModuleWithDeclareModuleId
} = require('../../utils/goog');
const {createEs6Shim} = require('../../utils/shim');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  // Replace goog.module statement with goog.declareModuleId. Only continue if a module was found.
  const moduleName = replaceModuleWithDeclareModuleId(root);
  if (moduleName) {
    // Replace goog 'exports' with ES6 export statements.
    const isDefault = replaceModuleExportsWithEs6(root);

    // If the module used a default export, create a shim to preserve backward compatibility.
    if (isDefault && moduleName && !options.dry) {
      createEs6Shim(file.path, moduleName);
    }

    // Remove goog.module.declareLegacyNamespace, if present.
    removeLegacyNamespace(root);
  }

  return printSource(root);
};
