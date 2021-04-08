const jscs = require('jscodeshift');

const {loadDeps} = require('../../utils/goog');
const {convertGlobalRefs, convertOSGlobal, isOSGlobal} = require('../../utils/opensphere');
const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

loadDeps();

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  root.find(jscs.MemberExpression, isOSGlobal).forEach(path => {
    convertOSGlobal(root, path);
  });

  convertGlobalRefs(root);

  return printSource(root);
};
