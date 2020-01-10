const jscs = require('jscodeshift');
const {addLegacyNamespace} = require('../../utils/goog');
const {createCall, createFindCallFn, createFindMemberExprObject} = require('../../utils/jscs');
const {convertClass, isClosureClass} = require('../../utils/classes');
const sourceOptions = require('../../utils/sourceoptions');

module.exports = (file, api, options) => {
  const root = jscs(file.source);
  const modules = [];

  // replace all goog.provide statements with goog.module
  const findFn = createFindCallFn('goog.provide');
  root.find(jscs.CallExpression, findFn).forEach((path, idx, paths) => {
    const args = path.value.arguments;
    modules.push(args[0].value);

    jscs(path).replaceWith(createCall('goog.module', args));

    if (!idx) {
      addLegacyNamespace(path.parent);
    }
  });

  modules.forEach(moduleName => {
    root.find(jscs.AssignmentExpression, {
      left: createFindMemberExprObject(moduleName),
      right: {
        type: 'FunctionExpression'
      }
    }).forEach(path => {
      if (isClosureClass(path.parent.value)) {
        convertClass(root, path, moduleName);
      }
    });
  });

  return root.toSource(sourceOptions);
};
