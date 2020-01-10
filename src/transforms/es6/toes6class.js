const jscs = require('jscodeshift');
const {addLegacyNamespace} = require('../../utils/goog');
const {createCall, createFindCallFn, createFindMemberExprObject} = require('../../utils/jscs');
const {convertClass} = require('../../utils/classes');
const {isClosureClass, isControllerClass, isDirective} = require('../../utils/goog');
const {getDefaultSourceOptions} = require('../../utils/sourceoptions');

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
      if (isDirective(path.parent.value)) {
        // TODO: convert directive
      } else if (isControllerClass(path.parent.value)) {
        // TODO: properly convert UI controller
        convertClass(root, path, moduleName);
      } else if (isClosureClass(path.parent.value)) {
        convertClass(root, path, moduleName);
      } else {
        // TODO: convert other namespace
      }
    });
  });

  // TODO: create shim for new controller/directive. this should *not* happen during tests or dry runs.

  return root.toSource(getDefaultSourceOptions());
};
