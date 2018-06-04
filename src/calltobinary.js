const get = require('get-value');
const jscs = require('jscodeshift');
const {logger} = require('./logger');

/**
 * If a node has leading comments.
 * @param {Node} node The node.
 * @return {boolean} If the node has leading comments.
 */
const hasLeadingComments = node => {
  if (get(node, 'leadingComments.length')) {
    return true;
  }

  const {comments} = node;
  return comments && comments.some(comment => comment.leading);
};

/**
 * If a node is parenthesized.
 * @param {Node} node The node.
 * @return {boolean} If the node is parenthesized.
 */
const isParenthesized = node => node.parenthesizedExpression || !!get(node, 'extra.parenthesized');

/**
 * If a node is parenthesized and has leading comments.
 * @param {Node} node The node.
 * @return {boolean} If the node is parenthesized and has leading comments.
 */
const isParenthesizedWithLeadingComments = node => hasLeadingComments(node) && isParenthesized(node);

/**
 * Log the file path and line number (if defined).
 * @param {string} file The file path.
 * @param {number|undefined} line The line number.
 */
const getLogWarningPrefix = (file, line) => {
  const lineText = line != null ? (':' + line) : '';
  return `${file}${lineText}: `;
};

/**
 * Log a warning for the ReturnStatement caveat.
 * @param {string} file The file path.
 * @param {number|undefined} line The line number.
 */
const logReturnWarning = (file, line) => {
  const message = getLogWarningPrefix(file, line) +
      'JSDoc @type comment removed to avoid a recast formatting issue. Check the diff/build and ' +
      'determine if the comment should be restored.'
  logger.warn(message);
};

/**
 * Log a warning for the ConditionalExpression caveat.
 * @param {string} file The file path.
 * @param {number|undefined} line The line number.
 */
const logConditionalWarning = (file, line) => {
  const message = getLogWarningPrefix(file, line) +
      'JSDoc comment block may have been removed from LHS of conditional statement. Check the ' +
      'diff/build and determine if the comment should be restored.'
  logger.warn(message);
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
      const pParentNode = get(parentPath, 'parent.value');

      if (pParentNode && pParentNode.type === 'ReturnStatement') {
        //
        // If a return statement starts with a comment, recast will wrap the entire return statement in parens to
        // "avoid ASI issues". This will break formatting, so remove the comment and warn the developer so they can
        // determine if the comment is actually required.
        //
        // This usually happens when the return value is typed with a JSDoc @type comment.
        //
        delete parentNode.comments;

        logReturnWarning(file.path, get(pParentNode, 'loc.start.line'));
        return;
      }
    }

    if (parentNode.type === 'ConditionalExpression' && isParenthesizedWithLeadingComments(parentNode.consequent)) {
      //
      // If the LHS of a conditional statement is parenthesized with a leading comment, recast will drop the comment.
      // This seems to be a bug, but I haven't tracked down exactly why this happens. The RHS is not affected.
      //
      // This usually happens when the value is typed with a JSDoc @type comment.
      //
      logConditionalWarning(file.path, get(parentNode, 'loc.start.line'));
      return;
    }


    testForJsdocWarning(file, parentPath);
  }
};

/**
 * Get the left side of the binary expression.
 * @param {NodePath} path The call expression node.
 * @param {Object} options The BinaryExpression options.
 * @return {Node|undefined} The AST node for the left side of the binary expression.
 */
const getLeftSide = (path, options) => {
  if (typeof options.leftSide === 'function') {
    return options.leftSide(path);
  } else if (options.leftSide) {
    return options.leftSide;
  }

  return get(path, 'node.arguments.0');
};

/**
 * Replace a CallExpression with a BinaryExpression.
 * @param {Node} file The root node.
 * @param {Object} callOptions The CallExpression matching options, passed to `root.find`.
 * @param {Object} binaryOptions The BinaryExpression options.
 */
module.exports = (file, callOptions, binaryOptions) => {
  const root = jscs(file.source);

  // find call expressions matching the provided options
  root.find(jscs.CallExpression, callOptions).forEach(path => {
    const parentNode = get(path, 'parent.node');
    const leftSide = getLeftSide(path, binaryOptions);
    if (leftSide) {
      if (parentNode && parentNode.type === 'UnaryExpression' && parentNode.operator === '!') {
        // replace `!expression(arg)`
        jscs(path.parent).replaceWith(pp => jscs.binaryExpression(binaryOptions.notExpression, leftSide, binaryOptions.rightSide));

        testForJsdocWarning(file, path);
      } else {
        // replace `expression(arg)`
        jscs(path).replaceWith(pp => jscs.binaryExpression(binaryOptions.expression, leftSide, binaryOptions.rightSide));

        testForJsdocWarning(file, path);
      }
    }
  });

  return root;
};
