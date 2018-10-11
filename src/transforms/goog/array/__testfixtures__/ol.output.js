goog.provide('os.array.find');

goog.require('goog.array');
goog.require('ol.array');
goog.require('os.array');

// array/function vars
ol.array.includes(someArray, someValue);

// array/function properties on this
ol.array.includes(this.someArray, this.someValue);

// inline array + function
ol.array.find(['a', 'b', 'c'], function(el, idx, arr) {
  return el === 'b';
});

// array/function vars
ol.array.find(someArray, someFunction);

// array/function properties on this + this arg
ol.array.find(this.someArray, this.someFunction.bind(this));

// inline function
ol.array.find(someArray, function(el, idx, arr) {
  return el === 'The One';
}.bind(this));

// inline array + function
ol.array.findIndex(['a', 'b', 'c'], function(el, idx, arr) {
  return el === 'b';
});

// array/function vars
ol.array.findIndex(someArray, someFunction);

// array/function properties on this + this arg
ol.array.findIndex(this.someArray, this.someFunction.bind(this));

// inline function
ol.array.findIndex(someArray, function(el, idx, arr) {
  return el === 'The One';
}.bind(this));

// array/function vars
ol.array.remove(someArray, someValue);

// array/function properties on this
ol.array.remove(this.someArray, this.someValue);
