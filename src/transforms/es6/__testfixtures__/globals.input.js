goog.provide('my.transform.clazz');

goog.require('os.ui.MyClass');
goog.require('os.MapContainer');


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
  os.ui.apply();

  // an implicit require reusing the generated require
  os.ui.anotherAction();

  // a non-implicit require with partially conflicting namespace to the implicit require
  const mc = new os.ui.MyClass();

  // an implicit require with an assignment expression
  const s = os.settings.get(my.transform.clazz.STR_CONSTANT);

  // usually implicit require, sometimes require'd properly (NOT require'd here)
  os.feature.doSomething();

  // usually implicit require, sometimes require'd properly (require'd here)
  os.MapContainer.getInstance().doSomething();

  // read from configs file (WARNING: NOT ASSUMED TO BE CONFIGURED IN THE TEST)
  bits.coreui.doSomething();

  // don't replace
  path.to.nothing();

  // an implicit require with a return expression
  return os.alertManager.sendAlert(x, y, z, mc, s);
} 