/**
 * @file Replaces `goog.bind` calls with `Function#bind`.
 */

const jscs = require('jscodeshift');
const get = require('get-value');
const {getDefaultSourceOptions} = require('../../utils/sourceoptions');

/**
 * If a node is a `goog.bind` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogBind = node => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'bind'}
    }
  });
};

/**
 * Replace `goog.bind` with `Function#bind`.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  root.find(jscs.CallExpression, isGoogBind).forEach(path => {
    const args = path.value.arguments;
    if (args && args.length > 1) {
      if (args[0].type === 'FunctionExpression' || args[0].type === 'MemberExpression') {
        const bindExpression = jscs.memberExpression(args[0], jscs.identifier('bind'));
        const callExpression = jscs.callExpression(bindExpression, args.slice(1));

        if (args[0].type === 'FunctionExpression') {
          const pParent = get(path, 'parent.parent.value');
          const comments = args[0].leadingComments || args[0].comments;
          if (pParent && pParent.type === 'VariableDeclaration' && comments && comments.length) {
            delete args[0].comments;
            delete args[0].leadingComments;
            pParent.comments = comments;
          }
        }

        jscs(path).replaceWith(callExpression);
      }
    }
  });

  return root.toSource(getDefaultSourceOptions());
};
