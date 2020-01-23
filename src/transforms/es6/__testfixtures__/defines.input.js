goog.provide('os.ns1');
goog.provide('os.ns2');


/**
 * @define {string} Example of a define on the provided namespace.
 */
goog.define('os.ns1.PROPERTY_ON_NS', 'Hello');


/**
 * @define {string} Example of a define on a child of the provided namespace.
 */
goog.define('os.ns1.other.PROPERTY_ON_CHILD_NS', 'World');


/**
 * @define {string} Example of a define on the parent of the provided namespace.
 */
goog.define('os.PROPERTY_ON_PARENT_NS', '!!!');


/**
 * @define {string} Example of a duplicate named define not on the provided namespace.
 */
goog.define('PROPERTY_ON_PARENT_NS', '!!!');


/**
 * @define {string} Example of a define on an alternate provided namespace.
 */
goog.define('os.ns2.PROPERTY_ON_SECOND_NS', '!!!');


/**
 * Get the define on the provided namespace.
 * @return {string}
 */
os.ns1.getPropertyOnNs = function() {
  return os.ns1.PROPERTY_ON_NS;
};


/**
 * Get the define on the child namespace.
 * @return {string}
 */
os.ns1.getPropertyOnChildNs = function() {
  return os.ns1.other.PROPERTY_ON_CHILD_NS;
};


/**
 * Get the define on the parent namespace.
 * @return {string}
 */
os.ns1.getPropertyOnParentNs = function() {
  return os.PROPERTY_ON_PARENT_NS;
};


/**
 * Get the duplicate named define on the parent namespace.
 * @return {string}
 */
os.ns1.getDuplicatePropertyOnParentNs = function() {
  return PROPERTY_ON_PARENT_NS;
};


/**
 * Get the define on the second namespace.
 * @return {string}
 */
os.ns2.getPropertyOnSecondNs = function() {
  return os.ns2.PROPERTY_ON_SECOND_NS;
};
