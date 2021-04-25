goog.module('my.transform.clazz');

const MapContainer = goog.require('os.MapContainer');
const osFeature = goog.require('os.feature');
const ui = goog.require('os.ui');
const MyClass = goog.require('os.ui.MyClass');
const AlertManager = goog.require('os.alert.AlertManager');
const Settings = goog.require('os.config.Settings');


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
  ui.apply();

  // an implicit require reusing the generated require
  ui.anotherAction();

  // an explicit require with partially conflicting namespace to the implicit require
  const mc = new MyClass();

  // not in deps.js, falls back to use os.ui
  const mc2 = new ui.MyClass2();

  // an implicit require with an assignment expression
  const s = Settings.getInstance().get(STR_CONSTANT);

  // usually implicit require, sometimes require'd properly (NOT require'd here)
  osFeature.doSomething();

  // usually implicit require, sometimes require'd properly (require'd here)
  MapContainer.getInstance().doSomething();

  // usually implicit require, but require'd anyway and needs the implicit conversion instead
  AlertManager.getInstance().warning('WARNING');

  // don't replace
  path.to.nothing();

  // an implicit require with a return expression
  return AlertManager.getInstance().sendAlert(x, y, z, mc, s);
}
