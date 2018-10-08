/**
 * @file Replaces `goog.exportProperty` calls with `@export` if possible, falling back to an assignment
 *               expression.
 */

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
const isGEPCall = node => {
  return node.type === 'CallExpression' && jscs.match(node, googExportPropertyFilter);
};

/**
 * If a node is a `goog.exportProperty` call that can be replaced by `@export`.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isExportableCall = node => {
  if (isGEPCall(node) && get(node, 'arguments.0.property.name') === 'prototype') {
    const exportName = get(node.arguments[1].value);
    const fnName = get(node.arguments[2].property.name);
    return exportName && fnName && (exportName == fnName || `${exportName}_` == fnName);
  }

  return false;
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
        // strip trailing underscore from private functions
        // BUG: A recast bug causes this to also drop empty lines above the statement.
        prev.expression.left.property.name = prev.expression.left.property.name.replace(/_$/, '');

        if (prev.comments[prev.comments.length - 1].type === 'CommentBlock') {
          const prevComment = prev.comments.pop();

          // add @export to comment block
          let newComment = prevComment.value.replace(/\s+$/, '\n * @export\n ');

          // remove @protected annotation
          newComment = newComment.replace('\n * @protected', '');

          // remove @private annotation
          newComment = newComment.replace('\n * @private', '');

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
