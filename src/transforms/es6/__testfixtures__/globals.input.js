goog.provide('my.transform.clazz');

goog.require('os.alert.AlertManager'); // no duplicates
goog.require('os.alertManager'); // no duplicates
goog.require('test.os.MapContainer');
goog.require('test.os.ui.MyClass');


/**
 * @type {string}
 * @const
 */
my.transform.clazz.STR_CONSTANT = 'str.constant.value';

/**
 * @param {string} x
 * @param {string} y
 * @param {string} z
 * @returns {boolean}
 */
my.transform.clazz.i = function(x, y, z) {
  // an implicit require
  test.os.ui.apply();

  // an implicit require reusing the generated require
  test.os.ui.anotherAction();

  // a non-implicit require with partially conflicting namespace to the implicit require
  const mc = new test.os.ui.MyClass();

  // an implicit require with an assignment expression
  const s = os.settings.get(my.transform.clazz.STR_CONSTANT);

  // usually implicit require, sometimes require'd properly (NOT require'd here)
  test.os.feature.doSomething();

  // usually implicit require, sometimes require'd properly (require'd here)
  test.os.MapContainer.getInstance().doSomething();

  // usually implicit require, but require'd anyway and needs the implicit conversion instead
  os.alertManager.warning('WARNING');

  // don't replace
  path.to.nothing();

  // an implicit require with a return expression
  return os.alertManager.sendAlert(x, y, z, mc, s);
} 
