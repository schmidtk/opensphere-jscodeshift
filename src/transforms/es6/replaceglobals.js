const jscs = require('jscodeshift');

const {
  isKarmaTest,
  getDependency,
  getGlobalRefs,
  replaceSrcGlobals,
  replaceTestGlobals,
  loadDeps
} = require('../../utils/goog');
const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

require('../../utils/opensphere');
loadDeps();

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  // Base namespaces to convert.
  const baseNamespaces = ['goog', 'ol', 'olcs', 'os', 'plugin'];

  // Blacklist for modules that shouldn't be required.
  const blacklist = [
    'goog',
    'goog.module'
  ];

  baseNamespaces.forEach((ns) => {
    const globalRefs = getGlobalRefs(root, ns, blacklist);

    if (globalRefs.length) {
      globalRefs.forEach((globalRef) => {
        const dependency = getDependency(globalRef, true);
        if (dependency && dependency.moduleName && !blacklist.includes(dependency.moduleName)) {
          if (isKarmaTest(root)) {
            replaceTestGlobals(root, dependency.moduleName);
          } else {
            replaceSrcGlobals(root, dependency.moduleName);
          }
        }
      });
    }
  });

  return printSource(root);
};
