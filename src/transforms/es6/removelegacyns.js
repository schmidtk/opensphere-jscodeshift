const jscs = require('jscodeshift');

const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

const {
  removeLegacyNamespace
} = require('../../utils/goog');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  // Remove goog.module.declareLegacyNamespace, if present.
  if (removeLegacyNamespace(root)) {
    return printSource(root);
  }

  return file.source;
};
