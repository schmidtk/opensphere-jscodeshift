goog.provide('os.test');

goog.require('goog.array');
goog.require('ol.array');
goog.require('os.array');

os.array.clear(someArray);
os.array.clear(this.someArray);
os.array.clear(arrFn());

os.array.forEach(arr, function(item, idx, arr) {
  // stuff
}, this);
