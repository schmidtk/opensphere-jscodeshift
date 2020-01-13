const jscs = require('jscodeshift');
const {createFindMemberExprObject} = require('../../utils/jscs');
const {convertClass, replaceProvidesWithModules} = require('../../utils/classes');
const {isClosureClass, isControllerClass, isDirective} = require('../../utils/goog');
const {getDefaultSourceOptions} = require('../../utils/sourceoptions');
const {logger} = require('../../utils/logger');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  const modules = replaceProvidesWithModules(root);

  if (modules.length > 1) {
    logger.warn(`${file.path}: detected ${modules.length} modules in file.`);
  }

  modules.forEach(moduleName => {
    root.find(jscs.AssignmentExpression, {
      left: createFindMemberExprObject(moduleName)
    }).forEach(path => {
      if (isDirective(path.parent.value)) {
        // TODO: convert directive
      } else if (isControllerClass(path.parent.value)) {
        // TODO: properly convert UI controller
        convertClass(root, path, moduleName);
      } else if (isClosureClass(path.parent.value)) {
        convertClass(root, path, moduleName);
      }
    });
  });

  // TODO: create shim for new controller/directive. this should *not* happen during tests or dry runs.

  return root.toSource(getDefaultSourceOptions());
};
