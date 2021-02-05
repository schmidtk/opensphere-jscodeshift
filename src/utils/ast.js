const jscs = require('jscodeshift');
const camelcase = require('camelcase');
const reserved = require('reserved-words');


/**
 * Variable names that are disallowed due to conflicts with JS or the compiler. Most language-specific words are
 * detected by reserved-words.
 * @type {!Array<string>}
 */
const DISALLOWED_VARS = [
  // Types
  'Array',
  'Boolean',
  'Function',
  'Number',
  'Object',
  'String',

  // JSDoc types
  'boolean',
  'function',
  'number',
  'string',

  // Special values not handled by reserved-words
  'undefined',
  'NaN',

  // JS/Closure keywords not handled by reserved words
  'implements',
  'exports'
];


/**
 * Copy comments from one node to another.
 * @param {Node} source The source node.
 * @param {Node} target The target node.
 * @param {boolean=} remove If comments should also be removed from the source, defaults to true.
 */
const copyComments = (source, target, remove = true) => {
  if (source && source.comments && target) {
    const oldComments = source.comments;

    if (remove) {
      source.comments = null;
    }

    target.comments = oldComments ? oldComments.map(c => jscs.commentBlock(c.value)) : null;
  }
};


/**
 * Create a Node find function to locate a call expression by path (ie, `goog.array.find`).
 * @param {string} path The call function path.
 * @return {function(Node):boolean}
 */
const createFindCallFn = path => {
  return node => node.type === 'CallExpression' && jscs.match(node, {callee: createFindMemberExprObject(path)});
};


/**
 * Create an object to find a member expression.
 * @param {string} memberPath The dot delimited member expression path.
 * @return {Object}
 */
const createFindMemberExprObject = (memberPath) => {
  const pathParts = Array.isArray(memberPath) ? memberPath : memberPath.split('.');
  return pathParts.reduce((obj, current, idx, arr) => {
    if (!obj) {
      if (arr.length > idx + 1) {
        obj = {
          object: {name: arr[idx]},
          property: {name: arr[idx + 1]}
        };
      } else {
        obj = {
          property: {name: arr[idx]}
        }
      }
    } else if (arr.length > idx + 1) {
      obj = {
        object: obj,
        property: {name: arr[idx + 1]}
      };
    }

    return obj;
  }, undefined);
};


/**
 * Create a var name from a list of parts.
 * @param {!Array<string>} parts The parts. These will be combined in camelcase.
 * @param {string|undefined} prefix The prefix to add.
 * @param {string|undefined} suffix The suffix to add.
 * @return {string} The var name.
 */
const getVarName = (parts, prefix, suffix) => {
  prefix = prefix || '';
  suffix = suffix || '';

  //
  // If only one part is provided, use it. Otherwise combine them in camelcase.
  //
  const baseName = parts.length === 1 ? parts[0] : camelcase(parts.join('-'));

  return `${prefix}${baseName}${suffix}`;
};


/**
 * Get a unique variable name to use within the scope of the provided path.
 * @param {NodePath} root The scope's node path.
 * @param {string} originalName The original dot-delimited name.
 * @param {string|undefined} prefix Prefix for the variable name.
 * @return {string} The variable name.
 */
const getUniqueVarName = (root, originalName, prefix) => {
  const moduleParts = originalName.split('.');
  prefix = prefix || '';

  // try the last part of the module name first
  let varName = `${prefix}${moduleParts[moduleParts.length - 1]}`;

  // camelcase the parts
  if (!varName || hasVar(root, varName)) {
    varName = getVarName(moduleParts, prefix);
  }

  // add a counter until a unique name is found
  let i = 1;
  while (hasVar(root, varName)) {
    varName = getVarName(moduleParts, prefix, i++);
  }

  return varName;
};


/**
 * If a variable name is declared within the file.
 * @param {NodePath} root The root node.
 * @param {string} varName The variable name.
 * @return {boolean} If the variable is declared in the file.
 */
const hasVar = (root, varName) => {
  return reserved.check(varName, 'es2015') ||
      DISALLOWED_VARS.indexOf(varName) > -1 ||
      root.find(jscs.VariableDeclarator, {id: {name: varName}}).length > 0 ||
      root.find(jscs.ClassDeclaration, {id: {name: varName}}).length > 0 ||
      root.find(jscs.FunctionExpression, (node) => {
        return node.params.some((param) => param.name === varName);
      }).length > 0;
};


/**
 * If a node represents a CallExpression for the provided function.
 * @param {Node} node The node.
 * @param {string} fn The full function name.
 * @return {boolean}
 */
const isCall = (node, fn) => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: createFindMemberExprObject(fn)
  });
};


/**
 * Check if a string exists in a comment.
 * @param {Node} root The root node.
 * @param {string} value The value to find.
 * @return {boolean} If the value was found in a comment.
 */
const isInComment = (root, value) => {
  return !!value && root.find(jscs.Comment).some((path) => {
    return path.value.type === 'CommentBlock' && path.value.value.indexOf(value) > -1;
  });
};


const isReferenced = (root, moduleName) => {
  return moduleName.indexOf('.') > -1 ?
      root.find(jscs.MemberExpression, createFindMemberExprObject(moduleName)).length > 0 :
      root.find(jscs.Identifier, {name: moduleName}).length > 0;
};


/**
 * Replace occurrences of a pattern in all comments.
 * @param {NodePath} root The root node path.
 * @param {string|RegExp} pattern The string or regular expression to match.
 * @param {string|Function} replacement The replacement string, or a function to produce the replacement.
 */
const replaceInComments = (root, pattern, replacement) => {
  if (pattern == replacement) {
    return;
  }

  root.find(jscs.Comment).forEach((path) => {
    const comment = path.value;
    if (comment.value && comment.value.indexOf(pattern) > -1) {
      let newComment = comment.value.replace(pattern, replacement);
      if (comment.type === 'CommentBlock') {
        //
        // if the comment specifies an indent level, replace that in the new comment or the indentation will be
        // incorrect when printed.
        //
        // https://github.com/benjamn/recast/issues/297
        //
        if (comment.loc && comment.loc.indent > 0) {
          const pattern = new RegExp(`^[\t ]{${comment.loc.indent}}`, 'gm');
          newComment = newComment.replace(pattern, '');
        }

        jscs(path).replaceWith(jscs.commentBlock(newComment));
      } else if (comment.type === 'CommentLine') {
        jscs(path).replaceWith(jscs.commentLine(newComment));
      }
    }
  });
};


/**
 * Replace a function expression with an arrow function.
 * @param {Node} node The node.
 */
const replaceFunctionExpressionWithArrow = (node) => {
  if (node.type !== 'FunctionExpression') {
    return null;
  }

  // if the function body is a single return statement, make that the arrow function body
  let arrowBody;
  if (node.body.body.length === 1 && node.body.body[0].type === 'ReturnStatement') {
    arrowBody = node.body.body[0].argument;
  } else {
    arrowBody = node.body;
  }

  const arrowFn = jscs.arrowFunctionExpression(node.params, arrowBody, node.expression);
  copyComments(node, arrowFn);

  return arrowFn;
};


module.exports = {
  copyComments,
  createFindCallFn,
  createFindMemberExprObject,
  getUniqueVarName,
  hasVar,
  isCall,
  isInComment,
  isReferenced,
  replaceInComments,
  replaceFunctionExpressionWithArrow
};
