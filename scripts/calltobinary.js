const colors = require('colors/safe');

const isParenthesizedWithLeadingComments = (node) => {
  return node && node.leadingComments && node.leadingComments.length &&
      (node.extra && node.extra.parenthesized || node.parenthesizedExpression);
};

/**
 * Test if a JSDoc comment block would be moved inappropriately as a result of a node replacement.
 * @param {File} file The source file.
 * @param {Node} node The node being replaced.
 * @return {number} The line number of the JSDoc comment block, or NaN if none found.
 */
const testForJsdocWarning = (file, api, path) => {
  if (path && path.parent) {
    const parentPath = path.parent;
    const parentNode = parentPath.value;
    if (parentNode.type === 'ObjectExpression' && isParenthesizedWithLeadingComments(parentNode)) {
      const pParentNode = parentPath.parent ? parentPath.parent.value : undefined;
      if (pParentNode && pParentNode.type === 'ReturnStatement') {
        process.stdout.write(
          colors.yellow('[WARNING] ') +
          file.path + ':' + pParentNode.loc.start.line + ': ' +
          'JSDoc comment block may have been moved inside object literal parentheses. Verify diff before proceeding.\n'
        );

        return;
      }
    }

    if (parentNode.type === 'ConditionalExpression' &&
        (isParenthesizedWithLeadingComments(parentNode.consequent) ||
        isParenthesizedWithLeadingComments(parentNode.alternate))) {
      process.stdout.write(
        colors.yellow('[WARNING] ') +
        file.path + ':' + parentNode.loc.start.line + ': ' +
        'JSDoc comment block may have been removed from conditional statement. Verify diff before proceeding.\n'
      );

      return;
    }


    testForJsdocWarning(file, api, parentPath);
  }
};

/**
 * Replace a CallExpression with a BinaryExpression.
 * @param {Node} file The root node.
 * @param {Object} api The jscodeshift API.
 * @param {Object} callOptions The CallExpression matching options, passed to `root.find`.
 * @param {Object} binaryOptions The BinaryExpression options.
 */
const replaceCallWithBinaryExpression = (file, api, callOptions, binaryOptions) => {
  const j = api.jscodeshift;
  const root = j(file.source);

  // find call expressions matching the provided options
  root.find(j.CallExpression, callOptions).forEach(path => {
    const parentNode = path.parent ? path.parent.node : undefined;
    const leftSide = path.node.arguments[0];

    if (parentNode && parentNode.type === 'UnaryExpression' && parentNode.operator === '!') {
      // replace `!expression(arg)`
      j(path.parent).replaceWith(pp => j.binaryExpression(binaryOptions.notExpression, leftSide, binaryOptions.rightSide));

      testForJsdocWarning(file, api, path);
    } else {
      // replace `expression(arg)`
      j(path).replaceWith(pp => j.binaryExpression(binaryOptions.expression, leftSide, binaryOptions.rightSide));

      testForJsdocWarning(file, api, path);
    }
  });

  return root;
};

module.exports = replaceCallWithBinaryExpression;
