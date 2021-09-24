const jscs = require('jscodeshift');

const { createFindMemberExprObject } = require('../../utils/ast');
const { getDependency, getTempModuleName, hasDefaultExport } = require('../../utils/goog.js');
const { printSource } = require('../../utils/jscs');
const { logger } = require('../../utils/logger');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  let changed = false;

  const fixDeclaration = (varDeclaration) => {
    const declarator = varDeclaration.value.declarations[0];
    if (declarator.id.type === 'Identifier') {
      const moduleName = declarator.init.arguments[0].value;
      const dependency = getDependency(getTempModuleName(moduleName)) || getDependency(moduleName);
      if (dependency && dependency.moduleType === 'es6' && hasDefaultExport(dependency)) {
        declarator.id = jscs.objectPattern([jscs.property('init', jscs.identifier('default'), declarator.id)]);
        changed = true;
      }
    }
  };

  // Fix variable declarations from a goog.require.
  root.find(jscs.VariableDeclaration, {
    declarations: [{
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.require')
      }
    }]
  }).forEach(fixDeclaration);

  // Fix variable declarations from a goog.module.get.
  root.find(jscs.VariableDeclaration, {
    declarations: [{
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.module.get')
      }
    }]
  }).forEach(fixDeclaration);

  return changed ? printSource(root) : file.source;
};
