const jscs = require('jscodeshift');

const { isGoogRequire, isGoogModuleRequire, isGoogModuleRequireType, sortRequireNodes, sortModuleRequireNodes, isGoogDeclareModuleId, isESModuleFile } = require('./goog.js');
const { getSortedImportNodes } = require('./imports.js');

const sortESDependencies = (root) => {
  if (isESModuleFile(root)) {
    // Get all dependencies by group.
    const requires = root.find(jscs.ExpressionStatement, isGoogRequire);
    const imports = root.find(jscs.ImportDeclaration);
    const moduleRequires = root.find(jscs.VariableDeclaration,
        (node) => isGoogModuleRequire(node) || isGoogModuleRequireType(node));

    // Sort everything.
    const sortedRequires = requires.nodes().slice().sort(sortRequireNodes);
    const sortedImports = getSortedImportNodes(imports);
    const sortedModuleRequires = moduleRequires.nodes().slice().sort(sortModuleRequireNodes);

    // Remove everything.
    requires.forEach((path) => jscs(path).remove());
    imports.forEach((path) => jscs(path).remove());
    moduleRequires.forEach((path) => jscs(path).remove());

    // Insert sorted dependencies after the goog.declareModuleId statement.
    const program = root.find(jscs.Program).get();
    const programBody = program.value.body;
    for (let i = 0; i < programBody.length; i++) {
      const current = programBody[i];
      if (isGoogDeclareModuleId(current)) {
        // Final order: Bare requires -> imports -> module requires
        programBody.splice(i + 1, 0, ...sortedModuleRequires);
        programBody.splice(i + 1, 0, ...sortedImports);
        programBody.splice(i + 1, 0, ...sortedRequires);
        break;
      }
    }
  }
};

module.exports = {
  sortESDependencies
};
