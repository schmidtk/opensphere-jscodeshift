goog.provide('os.array.find');

goog.require('goog.array');
goog.require('os.array');

// array/function vars
goog.array.contains(someArray, someValue);

// array/function properties on this
goog.array.contains(this.someArray, this.someValue);

// inline array + function
goog.array.find(['a', 'b', 'c'], function(el, idx, arr) {
  return el === 'b';
});

// array/function vars
goog.array.find(someArray, someFunction);

// array/function properties on this + this arg
goog.array.find(this.someArray, this.someFunction, this);

// inline function
goog.array.find(someArray, function(el, idx, arr) {
  return el === 'The One';
}, this);

// inline array + function
goog.array.findIndex(['a', 'b', 'c'], function(el, idx, arr) {
  return el === 'b';
});

// array/function vars
goog.array.findIndex(someArray, someFunction);

// array/function properties on this + this arg
goog.array.findIndex(this.someArray, this.someFunction, this);

// inline function
goog.array.findIndex(someArray, function(el, idx, arr) {
  return el === 'The One';
}, this);

// array/function vars
goog.array.remove(someArray, someValue);

// array/function properties on this
goog.array.remove(this.someArray, this.someValue);
