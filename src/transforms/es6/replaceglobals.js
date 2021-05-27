const jscs = require('jscodeshift');

const {sortModuleRequires} = require('../../utils/goog');
const {convertGlobalRefs, convertLegacyRequires} = require('../../utils/opensphere');
const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

module.exports = (file, api, options) => {
  // Skip shims.
  if (file.path.endsWith('_shim.js')) {
    return file.source;
  }

  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  convertGlobalRefs(root);
  convertLegacyRequires(root);
  sortModuleRequires(root);

  return printSource(root);
};
