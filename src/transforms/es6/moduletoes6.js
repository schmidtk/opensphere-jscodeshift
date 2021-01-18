const jscs = require('jscodeshift');

const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

const {
  removeLegacyNamespace,
  replaceModuleExportsWithEs6,
  replaceModulesWithDeclareModuleId
} = require('../../utils/goog');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  replaceModulesWithDeclareModuleId(root);
  replaceModuleExportsWithEs6(root);
  removeLegacyNamespace(root);

  return printSource(root);
};
