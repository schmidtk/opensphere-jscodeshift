const jscs = require('jscodeshift');

/**
 * Get the root Karma describe above a node.
 * @param {NodePath} path The starting path.
 * @return {NodePath|undefined} The root describe, or undefined if not found.
 */
const getRootDescribe = (path) => {
  let rootDescribe;

  let currentPath = path;
  while (currentPath.parent && currentPath.parent !== currentPath) {
    currentPath = currentPath.parent;
    if (isKarmaDescribe(currentPath.value)) {
      rootDescribe = currentPath;
    }
  }

  return rootDescribe;
};

/**
 * If the node is a Karma describe() call. Also matches xdescribe and ddescribe variants.
 * @param {Node} node The node.
 * @return {boolean} If the node is a Karma describe() call.
 */
const isKarmaDescribe = (node) => {
  return /$[xd]?describe$/.test(node?.callee?.name) === 'describe' &&
      node?.arguments.length >= 2 && node.arguments[0].type === 'Literal';
};

/**
 * If the root node is for a Karma test file.
 * @param {Node} root The root node.
 * @return {boolean} If this is a test file.
 */
const isKarmaTest = (root) => {
  // Check that there is a describe call in the Program body.
  const nodes = root.find(jscs.CallExpression, isKarmaDescribe);
  return nodes.some((node) => node?.parent?.parent?.value?.type === 'Program');
};

module.exports = {
  getRootDescribe,
  isKarmaDescribe,
  isKarmaTest
}
