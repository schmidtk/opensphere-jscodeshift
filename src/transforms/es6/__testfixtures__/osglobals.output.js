goog.module('my.transform.clazz');
goog.module.declareLegacyNamespace();

const alertManager = goog.require('os.alert.AlertManager');
const feature = goog.require('test.os.feature');
const settings = goog.require('os.config.Settings');
const ui = goog.require('test.os.ui');
const MapContainer = goog.require('test.os.MapContainer');
const MyClass = goog.require('test.os.ui.MyClass');


/**
 * @type {string}
 */
const STR_CONSTANT = 'str.constant.value';

/**
 * @param {string} x
 * @param {string} y
 * @param {string} z
 * @returns {boolean}
 */
const i = function(x, y, z) {
  // an implicit require
  ui.apply();

  // an implicit require reusing the generated require
  ui.anotherAction();

  // a non-implicit require with partially conflicting namespace to the implicit require
  const mc = new MyClass();

  // an implicit require with an assignment expression
  const s = settings.getInstance().get(STR_CONSTANT);

  // usually implicit require, sometimes require'd properly (NOT require'd here)
  feature.doSomething();

  // usually implicit require, sometimes require'd properly (require'd here)
  MapContainer.getInstance().doSomething();

  // usually implicit require, but require'd anyway and needs the implicit conversion instead
  alertManager.getInstance().warning('WARNING');

  // don't replace
  path.to.nothing();

  // an implicit require with a return expression
  return alertManager.getInstance().sendAlert(x, y, z, mc, s);
};

exports = {
  STR_CONSTANT,
  i
};
