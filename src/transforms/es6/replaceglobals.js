const jscs = require('jscodeshift');

const {loadDeps} = require('../../utils/goog');
const {convertGlobalRefs} = require('../../utils/opensphere');
const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

loadDeps();

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  convertGlobalRefs(root);

  return printSource(root);
};
