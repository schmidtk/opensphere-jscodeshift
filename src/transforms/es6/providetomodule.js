const jscs = require('jscodeshift');
const {createFindMemberExprObject} = require('../../utils/jscs');
const {convertNamespaceExpression, convertClass, convertDirective, convertInterface, replaceProvidesWithModules, replaceUIModules} = require('../../utils/classes');
const {isClosureClass, isControllerClass, isDirective, isInterface} = require('../../utils/goog');
const {createUIShim} = require('../../utils/shim');
const {getDefaultSourceOptions} = require('../../utils/options');
const {abbreviatePath, logger} = require('../../utils/logger');
const {resolveThis} = require('../../utils/resolvethis');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  const logPath = abbreviatePath(file.path);

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
          logger.warn(`${logPath}: detected multiple directives in file.`);
        }

        convertDirective(root, path, moduleName);
      } else if (isClosureClass(path.parent.value)) {
        if (isControllerClass(path.parent.value)) {
          if (!controllerName) {
            controllerName = moduleName;
          } else {
            logger.warn(`${logPath}: detected multiple controllers in file.`);
          }
        }

        convertClass(root, path, moduleName);
      } else {
        path.value.left = jscs.identifier('exports');
      }
    });

    root.find(jscs.ExpressionStatement, {
      expression: {
        type: 'AssignmentExpression',
        left: {
          type: 'MemberExpression',
          object: createFindMemberExprObject(moduleName)
        }
      }
    }).forEach(path => {
      if (path.parent.value.type === 'Program') {
        convertNamespaceExpression(root, path, moduleName);
      }
    });

    root.find(jscs.ExpressionStatement, {
      expression: {
        type: 'MemberExpression',
        object: createFindMemberExprObject(moduleName)
      }
    }).forEach(path => {
      if (path.parent.value.type === 'Program') {
        convertNamespaceExpression(root, path, moduleName);
      }
    });
  });

  const replacedThisCount = resolveThis(root);
  if (replacedThisCount) {
    logger.warn(`${logPath}: [no-invalid-this] converted ${replacedThisCount} inline functions to arrow functions.`);
  }

  if (controllerName && directiveName) {
    moduleCount--;
    replaceUIModules(root, controllerName, directiveName);

    if (!options.dry) {
      createUIShim(file.path, controllerName, directiveName);
    }
  }

  if (moduleCount > 1) {
    logger.warn(`${logPath}: detected ${moduleCount} modules in file.`);
  }

  return root.toSource(getDefaultSourceOptions());
};
