goog.module('os.ns1');
goog.module('os.ns2');
goog.module.declareLegacyNamespace();


/**
 * @define {string} Example of a define on the provided namespace.
 */
const PROPERTY_ON_NS = goog.define('os.ns1.PROPERTY_ON_NS', 'Hello');

/**
 * @define {string} Example of a define on a child of the provided namespace.
 */
const _PROPERTY_ON_CHILD_NS = goog.define('os.ns1.other.PROPERTY_ON_CHILD_NS', 'World');

/**
 * @define {string} Example of a define on the parent of the provided namespace.
 */
const _PROPERTY_ON_PARENT_NS = goog.define('os.PROPERTY_ON_PARENT_NS', '!!!');

/**
 * @define {string} Example of a duplicate named define not on the provided namespace.
 */
const _PROPERTY_ON_PARENT_NS1 = goog.define('PROPERTY_ON_PARENT_NS', '!!!');

/**
 * @define {string} Example of a define on an alternate provided namespace.
 */
const PROPERTY_ON_SECOND_NS = goog.define('os.ns2.PROPERTY_ON_SECOND_NS', '!!!');

/**
 * Get the define on the provided namespace.
 * @return {string}
 */
const getPropertyOnNs = function() {
  return PROPERTY_ON_NS;
};

/**
 * Get the define on the child namespace.
 * @return {string}
 */
const getPropertyOnChildNs = function() {
  return _PROPERTY_ON_CHILD_NS;
};

/**
 * Get the define on the parent namespace.
 * @return {string}
 */
const getPropertyOnParentNs = function() {
  return _PROPERTY_ON_PARENT_NS;
};

/**
 * Get the duplicate named define on the parent namespace.
 * @return {string}
 */
const getDuplicatePropertyOnParentNs = function() {
  return _PROPERTY_ON_PARENT_NS1;
};

/**
 * Get the define on the second namespace.
 * @return {string}
 */
const getPropertyOnSecondNs = function() {
  return PROPERTY_ON_SECOND_NS;
};

exports = {
  getPropertyOnNs,
  getPropertyOnChildNs,
  getPropertyOnParentNs,
  getDuplicatePropertyOnParentNs,
  getPropertyOnSecondNs,
  PROPERTY_ON_NS,
  PROPERTY_ON_SECOND_NS
};
