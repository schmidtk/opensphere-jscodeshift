const jscs = require('jscodeshift');

const path = require('path');

const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

const {createFindMemberExprObject, getUniqueVarName} = require('../../utils/ast');
const {getDependency, getTempModuleName} = require('../../utils/goog');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  const workspacePath = path.resolve(require.resolve('opensphere'), '..', '..');
  const relativePath = path.relative(workspacePath, file.path);
  const currentProject = relativePath.split(path.sep)[0];

  const getDepPath = (dependency) => {
    let depPath = dependency.path;
    if (depPath.startsWith(`${currentProject}/`)) {
      const fileDir = path.resolve(file.path, '..');
      const depDir = path.resolve(path.join(workspacePath, dependency.path), '..');
      const depName = path.basename(dependency.path);

      depPath = path.join(path.relative(fileDir, depDir), depName);

      if (!depPath.startsWith('.')) {
        depPath = `./${depPath}`;
      }
    }

    return depPath;
  };

  // Replace assigned goog.require statements with imports when referencing an ES module.
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

    const dependency = getDependency(getTempModuleName(moduleName)) || getDependency(moduleName);
    if (dependency && dependency.moduleType === 'es6') {
      const depPath = getDepPath(dependency);

      const imports = declarator.id;
      if (imports.type === 'Identifier') {
        // Default import
        const importDecl = jscs.importDeclaration([jscs.importNamespaceSpecifier(imports)], jscs.literal(depPath));
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

  // Replace unassigned goog.require statements with imports when referencing an ES module.
  const requireExpressions = root.find(jscs.ExpressionStatement, {
    expression: {
      type: 'CallExpression',
      callee: createFindMemberExprObject('goog.require')
    }
  });

  requireExpressions.forEach((requireExpr) => {
    const moduleName = requireExpr.value.expression.arguments[0].value;
    const dependency = getDependency(getTempModuleName(moduleName)) || getDependency(moduleName);
    if (dependency && dependency.moduleType === 'es6') {
      const varName = getUniqueVarName(root, moduleName);
      const depPath = getDepPath(dependency);

      const importDecl = jscs.importDeclaration([jscs.importNamespaceSpecifier(jscs.identifier(varName))], jscs.literal(depPath));

      // disable eslint for unassigned goog.require statements, because the var will be unused
      importDecl.comments = [jscs.commentLine(' eslint-disable-line', false, true)];

      jscs(requireExpr).replaceWith(importDecl);
    }
  });

  // Update assigned requireType statements to use the expected {default: Thing} syntax for referencing default exports.
  const requireTypeDeclarations = root.find(jscs.VariableDeclaration, {
    declarations: [{
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.requireType')
      }
    }]
  });

  requireTypeDeclarations.forEach((requireTypeDecl) => {
    const declarator = requireTypeDecl.value.declarations[0];
    const moduleName = declarator.init.arguments[0].value;

    const dependency = getDependency(getTempModuleName(moduleName)) || getDependency(moduleName);
    if (dependency && dependency.moduleType === 'es6') {
      if (declarator.id.type === 'Identifier') {
        declarator.id = jscs.objectPattern([jscs.property('init', jscs.identifier('default'), declarator.id)]);
      }
    }
  });

  return printSource(root);
};
