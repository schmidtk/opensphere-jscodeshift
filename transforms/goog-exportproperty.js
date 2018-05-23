const jscs = require('jscodeshift');
const get = require('get-value');

/**
 * Filter object for matching a `goog.exportProperty` CallExpression node.
 * @type {Object}
 */
const googExportPropertyFilter = {
  callee: {
    object: {name: 'goog'},
    property: {name: 'exportProperty'}
  }
};

/**
 * If a node is a `goog.exportProperty` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGEPCall = function(node) {
  return node.type === 'CallExpression' && jscs.match(node, googExportPropertyFilter);
};

/**
 * If a node is a `goog.exportProperty` call that can be replaced by `@export`.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isExportableCall = function(node) {
  return isGEPCall(node) && get(node, 'arguments.0.property.name') === 'prototype' &&
      get(node.arguments[1].value) && get(node.arguments[1].value) === get(node.arguments[2].property.name);
};

/**
 * Replace a CallExpression with a BinaryExpression.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  root.find(jscs.CallExpression, isExportableCall).forEach(path => {
    if (get(path.parent.parent.value.type) === 'Program') {
      const programBody = get(path.parent.parent.value.body);
      const currentIndex = programBody ? programBody.indexOf(path.parent.value) : -1;
      const prev = currentIndex > 0 ? programBody[currentIndex - 1] : undefined;

      if (prev && prev.type === 'ExpressionStatement' && get(prev.comments.length) > 0) {
        if (prev.comments[prev.comments.length - 1].type === 'CommentBlock') {
          // add @export to comment block
          const prevComment = prev.comments.pop();
          const newComment = prevComment.value.replace(/\s+$/, '\n * @export\n ');
          prev.comments.push(jscs.commentBlock(newComment));

          // remove the expression
          jscs(path).remove();
        }
      }
    }
  });

  root.find(jscs.CallExpression, isGEPCall).forEach(path => {
    // replace the expression with an assignment
    const leftSide = jscs.memberExpression(path.node.arguments[0], path.node.arguments[1]);
    jscs(path).replaceWith(pp => jscs.assignmentExpression('=', leftSide, path.node.arguments[2]));
  });

  return root.toSource();
};
