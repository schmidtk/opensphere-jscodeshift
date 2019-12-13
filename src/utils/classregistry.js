/**
 * Registry of module name to Node.
 * @type {!Object<string, Node>}
 */
const registeredClasses = {};

/**
 * Get a class node by module name.
 * @param {string} moduleName The module name.
 * @return {Node|undefined} The class node, or undefined if not created.
 */
const getClassNode = moduleName => registeredClasses[moduleName];

/**
 * Add a class node to the registry.
 * @param {string} moduleName The goog.module name.
 * @param {Node} node The node.
 */
const registerClassNode = (moduleName, node) => {
  registeredClasses[moduleName] = node;
};

module.exports = {
  getClassNode,
  registerClassNode
};
