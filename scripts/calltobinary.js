const colors = require('colors/safe');
const jscs = require('jscodeshift');

const isParenthesizedWithLeadingComments = (node) => {
  return node && node.leadingComments && node.leadingComments.length &&
      (node.extra && node.extra.parenthesized || node.parenthesizedExpression);
};

/**
 * Test if a JSDoc comment block would be moved inappropriately as a result of a node replacement.
 * @param {File} file The source file.
 * @param {NodePath} path The node path being replaced.
 * @return {number} The line number of the JSDoc comment block, or NaN if none found.
 */
const testForJsdocWarning = (file, path) => {
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


    testForJsdocWarning(file, parentPath);
  }
};

/**
 * Replace a CallExpression with a BinaryExpression.
 * @param {Node} file The root node.
 * @param {Object} callOptions The CallExpression matching options, passed to `root.find`.
 * @param {Object} binaryOptions The BinaryExpression options.
 */
const replaceCallWithBinaryExpression = (file, callOptions, binaryOptions) => {
  const root = jscs(file.source);

  // find call expressions matching the provided options
  root.find(jscs.CallExpression, callOptions).forEach(path => {
    const parentNode = path.parent ? path.parent.node : undefined;
    const leftSide = path.node.arguments[0];

    if (parentNode && parentNode.type === 'UnaryExpression' && parentNode.operator === '!') {
      // replace `!expression(arg)`
      jscs(path.parent).replaceWith(pp => jscs.binaryExpression(binaryOptions.notExpression, leftSide, binaryOptions.rightSide));

      testForJsdocWarning(file, path);
    } else {
      // replace `expression(arg)`
      jscs(path).replaceWith(pp => jscs.binaryExpression(binaryOptions.expression, leftSide, binaryOptions.rightSide));

      testForJsdocWarning(file, path);
    }
  });

  return root;
};

module.exports = replaceCallWithBinaryExpression;
