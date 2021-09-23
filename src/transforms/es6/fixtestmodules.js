const jscs = require('jscodeshift');

const { createFindMemberExprObject } = require('../../utils/ast');
const { getDependency, getTempModuleName, hasDefaultExport } = require('../../utils/goog.js');
const { printSource } = require('../../utils/jscs');
const { isKarmaTest } = require('../../utils/karma');
const { logger } = require('../../utils/logger');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  let changed = false;

  if (isKarmaTest(root)) {
    const moduleGetDeclarations = root.find(jscs.VariableDeclaration, {
      declarations: [{
        init: {
          type: 'CallExpression',
          callee: createFindMemberExprObject('goog.module.get')
        }
      }]
    });

    moduleGetDeclarations.forEach((varDeclaration) => {
      const declarator = varDeclaration.value.declarations[0];
      const moduleName = declarator.init.arguments[0].value;
      const dependency = getDependency(getTempModuleName(moduleName)) || getDependency(moduleName);
      if (dependency && dependency.moduleType === 'es6' && hasDefaultExport(dependency)) {
        declarator.id = jscs.objectPattern([jscs.property('init', jscs.identifier('default'), declarator.id)]);
        changed = true;
      }
    });
  }

  return changed ? printSource(root) : file.source;
};
