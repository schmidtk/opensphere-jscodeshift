const jscs = require('jscodeshift');
const {createFindMemberExprObject} = require('../../utils/ast');
const {memberExpressionToString} = require('../../utils/jscs');
const {convertGoogDefine, convertNamespaceExpression, convertClass, convertDirective, convertInterface, replaceProvidesWithModules, replaceUIModules} = require('../../utils/classes');
const {addRequire, isClosureClass, isControllerClass, isDirective, isGoogDefine, isInterface, replaceLegacyRequire} = require('../../utils/goog');
const {createAssignmentShim, createUIShim} = require('../../utils/shim');
const {getDefaultSourceOptions} = require('../../utils/options');
const {abbreviatePath, logger} = require('../../utils/logger');
const {resolveThis} = require('../../utils/resolvethis');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  const logPath = abbreviatePath(file.path);

  const modules = replaceProvidesWithModules(root);
  const movedModules = [];
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
      } else if (modules.length === 1) {
        // the only module in the file is a direct assignment, so assign it as the default export
        path.value.left = jscs.identifier('exports');
      } else if (modules.length > 1) {
        // this typically happens when the file has a class and some const/enum properties that are also provided. to
        // fix without breaking changes, move the extra provide to a new file.
        const filePath = file.path.replace(/\/[^/]+$/, '');
        createAssignmentShim(root, path, moduleName, filePath, !options.dry);
        movedModules.push(moduleName);
        moduleCount--;
      }
    });

    // create a filter to detect treating the module as a namespace
    const namespaceMemberExpr = {
      type: 'MemberExpression',
      // single namespace path like "os" will be an identifier, while multiple will be a member expression
      object: moduleName.indexOf('.') > -1 ?
          createFindMemberExprObject(moduleName) :
          {type: 'Identifier', name: moduleName}
    };

    // convert assignment expressions declaring a property on the namespace and assinging a value
    root.find(jscs.ExpressionStatement, {
      expression: {
        type: 'AssignmentExpression',
        left: namespaceMemberExpr
      }
    }).forEach(path => {
      // only convert if the expression is at the root level of the file, and isn't a provided module
      if (path.parent.value.type === 'Program' &&
          modules.indexOf(memberExpressionToString(path.value.expression.left)) === -1) {
        convertNamespaceExpression(root, path, moduleName);
      }
    });

    // convert expression statements declaring a property on the namespace without assigning the property
    root.find(jscs.ExpressionStatement, {
      expression: namespaceMemberExpr
    }).forEach(path => {
      if (path.parent.value.type === 'Program') {
        convertNamespaceExpression(root, path, moduleName);
      }
    });
  });

  // convert goog.define statements
  root.find(jscs.ExpressionStatement, isGoogDefine).forEach(path => {
    if (path.parent.value.type === 'Program') {
      convertGoogDefine(root, path, modules);
    }
  });

  // resolve cases that might cause no-invalid-this eslint errors by using arrow functions instead of inline functions
  const replacedThisCount = resolveThis(root);
  if (replacedThisCount) {
    logger.warn(`${logPath}: [no-invalid-this] converted ${replacedThisCount} inline functions to arrow functions.`);
  }

  // create a shim for backward compatibility if a controller and directive are in the same file
  if (controllerName && directiveName) {
    moduleCount--;
    replaceUIModules(root, controllerName, directiveName);

    if (!options.dry) {
      createUIShim(file.path, controllerName, directiveName);
    }
  }

  // use module require syntax for all modules that were moved to another file and referenced locally
  movedModules.forEach(name => {
    if (root.find(jscs.MemberExpression, createFindMemberExprObject(name)).length) {
      addRequire(root, name);
      replaceLegacyRequire(root, name);
    }
  });

  if (moduleCount > 1) {
    logger.warn(`${logPath}: detected ${moduleCount} modules in file.`);
  }

  return root.toSource(getDefaultSourceOptions());
};
