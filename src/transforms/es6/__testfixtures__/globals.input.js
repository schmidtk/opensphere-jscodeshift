goog.module('my.transform.clazz');

goog.require('os.alert.AlertManager'); // no duplicates
goog.require('os.alertManager'); // no duplicates
goog.require('os.MapContainer');
goog.require('os.ui.MyClass');


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
my.transform.clazz.i = function(x, y, z) {
  // an implicit require
  os.ui.apply();

  // an implicit require reusing the generated require
  os.ui.anotherAction();

  // an explicit require with partially conflicting namespace to the implicit require
  const mc = new os.ui.MyClass();

  // not in deps.js, falls back to use os.ui
  const mc2 = new os.ui.MyClass2();

  // an implicit require with an assignment expression
  const s = os.settings.get(STR_CONSTANT);

  // usually implicit require, sometimes require'd properly (NOT require'd here)
  os.feature.doSomething();

  // usually implicit require, sometimes require'd properly (require'd here)
  os.MapContainer.getInstance().doSomething();

  // usually implicit require, but require'd anyway and needs the implicit conversion instead
  os.alertManager.warning('WARNING');

  // don't replace
  path.to.nothing();

  // an implicit require with a return expression
  return os.alertManager.sendAlert(x, y, z, mc, s);
}
