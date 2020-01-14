goog.module('os.ns.IMyInterface');

goog.module.declareLegacyNamespace();

goog.require('os.ns.IParentInterface1');
goog.require('os.ns.IParentInterface2');


/**
 * An interface.
 * @extends {os.ns.IParentInterface1}
 * @extends {os.ns.IParentInterface2}
 * @interface
 */
class IMyInterface {
  /**
   * Get the id of the thing.
   * @return {string} The id.
   */
  getId() {}

  /**
   * Set the id of the thing.
   * @param {string} value The new id.
   */
  setId(value) {}
}


/**
 * ID for {@see os.implements}
 * @const {string}
 */
IMyInterface.ID = 'os.ns.IMyInterface';


exports = IMyInterface;
