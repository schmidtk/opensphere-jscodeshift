const jscs = require('jscodeshift');
const {createFindMemberExprObject} = require('../../utils/jscs');
const {convertClass, convertDirective, convertInterface, replaceProvidesWithModules, replaceUIModules} = require('../../utils/classes');
const {isClosureClass, isControllerClass, isDirective, isInterface} = require('../../utils/goog');
const {createUIShim} = require('../../utils/shim');
const {getDefaultSourceOptions} = require('../../utils/options');
const {logger} = require('../../utils/logger');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  const modules = replaceProvidesWithModules(root);
  let moduleCount = modules.length;

  let directiveName;
  let controllerName;

  modules.forEach(moduleName => {
    root.find(jscs.AssignmentExpression, {
      left: createFindMemberExprObject(moduleName)
    }).forEach(path => {
      if (isInterface(path.parent.value)) {
        convertInterface(root, path, moduleName);
      } else if (isDirective(path.parent.value)) {
        if (!directiveName) {
          directiveName = moduleName;
        } else {
          logger.warn(`${file.path}: detected multiple directives in file.`);
        }

        convertDirective(root, path, moduleName);
      } else if (isClosureClass(path.parent.value)) {
        if (isControllerClass(path.parent.value)) {
          if (!controllerName) {
            controllerName = moduleName;
          } else {
            logger.warn(`${file.path}: detected multiple controllers in file.`);
          }
        }

        convertClass(root, path, moduleName);
      }
    });
  });

  if (controllerName && directiveName) {
    moduleCount--;
    replaceUIModules(root, controllerName, directiveName);

    if (!options.dry) {
      createUIShim(file.path, controllerName, directiveName);
    }
  }

  if (moduleCount > 1) {
    logger.warn(`${file.path}: detected ${moduleCount} modules in file.`);
  }

  return root.toSource(getDefaultSourceOptions());
};
