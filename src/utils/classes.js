const jscs = require('jscodeshift');
const {getClassNode} = require('./classregistry');

/**
 * Match comments that should be put in the constructor function.
 * @type {RegExp}
 */
const CTOR_COMMENT_REGEXP = /@ngInject/;

/**
 * Match comments that should be put in the constructor function.
 * @type {RegExp}
 */
const COMMENT_IGNORE_REGEXP = /@constructor/;

/**
 * Match @extends JSDoc.
 * @type {RegExp}
 */
const EXTENDS = /@extends/;

/**
 * Match @extends JSDoc with a generic type provided.
 * @type {RegExp}
 */
const EXTENDS_GENERIC = /@extends {.+<.+>}/;

/**
 * Adds a method to a class.
 */
const addMethodToClass = (moduleName, methodName, methodValue, isStatic) => {
  let classMethod;

  const classDef = getClassNode(moduleName);
  if (classDef) {
    classMethod = jscs.methodDefinition('method', jscs.identifier(methodName), methodValue, isStatic);
    classDef.body.body.push(classMethod);
  }

  return classMethod;
};

/**
 * Move a static class property to a static get function.
 * @param {NodePath} path Path to the property assignment node.
 * @param {string} moduleName The class module name.
 */
const addStaticGetToClass = (path, moduleName) => {
  const classDef = getClassNode(moduleName);
  if (classDef) {
    const propertyName = path.value.left.property.name;

    const getBlock = jscs.blockStatement([jscs.returnStatement(path.value.right)]);
    const getFn = jscs.functionExpression(null, [], getBlock);
    const staticGet = jscs.methodDefinition('get', jscs.identifier(propertyName), getFn, true);
    staticGet.comments = path.parent.value.comments;
    classDef.body.body.push(staticGet);

    jscs(path).remove();
  }
};

/**
 * If a node represents a Closure class constructor.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isClosureClass = node => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('@constructor') > -1;
  }
  return false;
}

/**
 * If a node is marked private in its comments.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isPrivate = (node) => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('@private') > -1;
  }
  return false;
};

/**
 * Split a comment into parts for the class and constructor.
 * @param {string} comment The original class comment.
 * @return {{classComment: string, ctorComment: string}}
 */
const splitCommentsForClass = (comment) => {
  const origParts = comment.split('\n');
  const classCommentParts = ['*'];
  const ctorCommentParts = ['*', ' * Constructor.'];

  let inParam = false;
  for (let i = 0; i < origParts.length; i++) {
    const part = origParts[i];
    const trimmed = part.trim();

    if (trimmed === '*') {
      // skip blank lines, and also assume a @param definition is finished
      inParam = false;
      continue;
    }

    if (inParam && !trimmed.startsWith('*   ')) {
      // assume multi-line params are indented at least two extra spaces
      inParam = false;
    }

    if (COMMENT_IGNORE_REGEXP.test(trimmed)) {
      // drop blacklisted comment
      continue;
    } else if (EXTENDS.test(trimmed) && !EXTENDS_GENERIC.test(trimmed)) {
      // drop @extends unless it provides a generic type
      continue;
    } else if (trimmed.startsWith('* @param') || inParam) {
      ctorCommentParts.push(part);
      inParam = true;
    } else if (CTOR_COMMENT_REGEXP.test(trimmed)) {
      ctorCommentParts.push(part);
    }else {
      classCommentParts.push(part);
    }
  }

  ctorCommentParts.push(' ');

  return {
    classComment: classCommentParts.join('\n'),
    ctorComment: ctorCommentParts.join('\n')
  };
};

module.exports = {
  addMethodToClass,
  addStaticGetToClass,
  isClosureClass,
  isPrivate,
  splitCommentsForClass
};
