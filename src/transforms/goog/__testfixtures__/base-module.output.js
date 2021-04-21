goog.module('os.ns');
goog.module.declareLegacyNamespace();

const fn = goog.require('os.fn');

const someFn = fn.noop;

fn.noop();

exports = {someFn};
