const jscs = require('jscodeshift');

const path = require('path');

const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

const {createFindMemberExprObject} = require('../../utils/ast');
const {getDependency, loadDeps} = require('../../utils/goog');

loadDeps();

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  const workspacePath = path.resolve(require.resolve('opensphere'), '..', '..');
  const relativePath = path.relative(workspacePath, file.path);
  const currentProject = relativePath.split(path.sep)[0];

  const requireDeclarations = root.find(jscs.VariableDeclaration, {
    declarations: [{
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.require')
      }
    }]
  });

  requireDeclarations.forEach((requireDecl) => {
    const declarator = requireDecl.value.declarations[0];
    const moduleName = declarator.init.arguments[0].value;

    const dependency = getDependency(moduleName);
    if (dependency && dependency.moduleType === 'es6') {
      let depPath = dependency.path;
      if (depPath.startsWith(`${currentProject}/`)) {
        const fileDir = path.resolve(file.path, '..');
        const depDir = path.resolve(path.join(workspacePath, dependency.path), '..');
        const depName = path.basename(dependency.path).replace('.js', '');

        if (fileDir === depDir) {
          depPath = `./${depName}`;
        } else {
          depPath = path.join(path.relative(fileDir, depDir), depName);
        }
      }

      const imports = declarator.id;
      if (imports.type === 'Identifier') {
        // Default import
        const importDecl = jscs.importDeclaration([jscs.importDefaultSpecifier(imports)], jscs.literal(depPath));
        jscs(requireDecl).replaceWith(importDecl);
      } else if (imports.type === 'ObjectPattern') {
        // Named imports
        const specifiers = imports.properties.map((prop) => {
          return jscs.importSpecifier(prop.key, prop.value);
        });
        const importDecl = jscs.importDeclaration(specifiers, jscs.literal(depPath));
        jscs(requireDecl).replaceWith(importDecl);
      } else {
        logger.warn(`Unsupported goog imports type: ${imports.type}`);
      }
    }
  });

  return printSource(root);
};
