const jscs = require('jscodeshift');

const path = require('path');

const {sortESDependencies} = require('../../utils/deps');
const {getWorkspacePath, printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

const {createFindMemberExprObject, copyComments} = require('../../utils/ast');
const {getDependency, getTempModuleName, hasDefaultExport, isESModuleFile} = require('../../utils/goog');

const fixForESModule = (root, file) => {
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

  const workspacePath = getWorkspacePath();
  const relativePath = path.relative(workspacePath, file.path);
  const currentProject = relativePath.split(path.sep)[0];

  const getDependencyImportPath = (dependency) => {
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
      changed = true;

      const depPath = getDependencyImportPath(dependency);

      const imports = declarator.id;
      if (imports.type === 'Identifier') {
        if (hasDefaultExport(dependency)) {
          // Default import
          const importDecl = jscs.importDeclaration([jscs.importDefaultSpecifier(imports)], jscs.literal(depPath));
          copyComments(requireDecl.value, importDecl);
          jscs(requireDecl).replaceWith(importDecl);
        } else {
          // Entire module
          const importDecl = jscs.importDeclaration([jscs.importNamespaceSpecifier(imports)], jscs.literal(depPath));
          copyComments(requireDecl.value, importDecl);
          jscs(requireDecl).replaceWith(importDecl);
        }
      } else if (imports.type === 'ObjectPattern') {
        // Named imports
        const props = imports.properties;
        if (props.length === 1 && props[0].key.name === 'default') {
          // Assigning a default export
          const importDecl = jscs.importDeclaration([jscs.importDefaultSpecifier(props[0].value)], jscs.literal(depPath));
          copyComments(requireDecl.value, importDecl);
          jscs(requireDecl).replaceWith(importDecl);
        } else {
          // Assigning named exports
          const specifiers = props.map((prop) => {
            return jscs.importSpecifier(prop.key, prop.value);
          });
          const importDecl = jscs.importDeclaration(specifiers, jscs.literal(depPath));
          copyComments(requireDecl.value, importDecl);
          jscs(requireDecl).replaceWith(importDecl);
        }
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
      changed = true;

      const depPath = getDependencyImportPath(dependency);

      // Bare goog.require statements should use a bare import to avoid an unused var eslint error
      const importDecl = jscs.importDeclaration([], jscs.literal(depPath));

      jscs(requireExpr).replaceWith(importDecl);
    }
  });

  // Fix variable declarations from a goog.requireType.
  root.find(jscs.VariableDeclaration, {
    declarations: [{
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.requireType')
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

  return changed;
};

const fixForGoog = (root) => {
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

  // Fix variable declarations from a goog.requireType.
  root.find(jscs.VariableDeclaration, {
    declarations: [{
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.requireType')
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

  return changed;
};

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  let changed = false;

  if (isESModuleFile(root)) {
    changed = fixForESModule(root, file);

    if (changed) {
      sortESDependencies(root);
    }
  } else {
    changed = fixForGoog(root);
  }

  return changed ? printSource(root) : file.source;
};
