const jscs = require('jscodeshift');

const {
  addLegacyRequire,
  isGoogRequireCall,
  isGoogRequireTypeCall,
  replaceLegacyRequire,
  sortModuleRequireTypes
} = require('../../utils/goog');
const {printSource} = require('../../utils/jscs');
const {logger} = require('../../utils/logger');

module.exports = (file, api, options) => {
  // Skip shims.
  if (file.path.endsWith('_shim.js')) {
    return file.source;
  }

  const root = jscs(file.source);
  logger.setCurrentFile(file.path);

  const olRegexp = /{.*ol\.[A-Z]\w+[^.]?.*}/;
  if (olRegexp.test(file.source)) {
    const existing = root.find(jscs.VariableDeclarator,
      (path) => {
        if (path.init && (isGoogRequireCall(path.init) || isGoogRequireTypeCall(path.init))) {
          return path.init.arguments[0].value === 'ol' &&
              path.id && path.id.type === 'Identifier' && path.id.name === 'ol';
        }
        return false;
      });
    if (!existing.length) {
      addLegacyRequire(root, 'ol');
      replaceLegacyRequire(root, 'ol');
      sortModuleRequireTypes(root);

      return printSource(root)
        .replace(`requireType('ol');\n\nconst`, `requireType('ol');\nconst`);
    }
  }

  return file.source;
};
