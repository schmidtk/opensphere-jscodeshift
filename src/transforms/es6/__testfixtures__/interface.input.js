goog.provide('os.ns.IMyInterface');

goog.require('os.ns.IParentInterface1');
goog.require('os.ns.IParentInterface2');


/**
 * An interface.
 * @extends {os.ns.IParentInterface1}
 * @extends {os.ns.IParentInterface2}
 * @interface
 */
os.ns.IMyInterface = function() {};


/**
 * ID for {@see os.implements}
 * @const {string}
 */
os.ns.IMyInterface.ID = 'os.ns.IMyInterface';


/**
 * Get the id of the thing.
 * @return {string} The id.
 */
os.ns.IMyInterface.prototype.getId;


/**
 * Set the id of the thing.
 * @param {string} value The new id.
 */
os.ns.IMyInterface.prototype.setId;
