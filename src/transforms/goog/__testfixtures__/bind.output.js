this.fn.bind(this);
this.fn.bind(this, arg1, arg2, arg3);

(function() {
  return true;
}).bind(this);

(function(a, b) {
  return a + b;
}).bind(this, a, b);

/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
var fn = function(a, b) {
  return a + b;
}.bind(this);
