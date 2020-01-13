const jscs = require('jscodeshift');
const {createFindMemberExprObject} = require('../../utils/jscs');
const {convertClass, convertDirective, replaceProvidesWithModules, replaceUIModules} = require('../../utils/classes');
const {isClosureClass, isControllerClass, isDirective} = require('../../utils/goog');
const {createUIShim} = require('../../utils/shim');
const {getDefaultSourceOptions} = require('../../utils/sourceoptions');
const {logger} = require('../../utils/logger');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  const modules = replaceProvidesWithModules(root);

  let directiveName;
  let controllerName;

  modules.forEach(moduleName => {
    root.find(jscs.AssignmentExpression, {
      left: createFindMemberExprObject(moduleName)
    }).forEach(path => {
      if (isDirective(path.parent.value)) {
        directiveName = moduleName;
        convertDirective(root, path, moduleName);
      } else if (isClosureClass(path.parent.value)) {
        if (isControllerClass(path.parent.value)) {
          controllerName = moduleName;
        }

        convertClass(root, path, moduleName);
      }
    });
  });

  if (controllerName && directiveName) {
    replaceUIModules(root, controllerName, directiveName);

    if (!options.dry) {
      createUIShim(file.path, controllerName, directiveName);
    }
  } else if (modules.length > 1) {
    logger.warn(`${file.path}: detected ${modules.length} modules in file.`);
  }


  return root.toSource(getDefaultSourceOptions());
};
