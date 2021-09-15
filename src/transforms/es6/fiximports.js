const jscs = require('jscodeshift');
const path = require('path');

const {getModuleRelativePath, isParentRelativeImport} = require('opensphere-jscodeshift/src/utils/ast');
const {sortImports} = require('opensphere-jscodeshift/src/utils/imports');
const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  const imports = root.find(jscs.ImportDeclaration);
  if (imports.some(isParentRelativeImport)) {
    imports.forEach((node) => {
      if (isParentRelativeImport(node)) {
        const importSource = node.value.source;
        const absPath = path.resolve(path.dirname(file.path), importSource.value);
        importSource.value = getModuleRelativePath(absPath);
      }
    });

    sortImports(root);
    
    return printSource(root);
  }

  return file.source;
};
