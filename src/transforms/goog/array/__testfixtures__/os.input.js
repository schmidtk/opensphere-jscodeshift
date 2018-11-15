goog.provide('os.test');

goog.require('goog.array');
goog.require('ol.array');

goog.array.clear(someArray);
goog.array.clear(this.someArray);
goog.array.clear(arrFn());

goog.array.forEach(arr, function(item, idx, arr) {
  // stuff
}, this);
