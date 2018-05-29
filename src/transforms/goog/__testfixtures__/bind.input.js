goog.bind(this.fn, this);
goog.bind(this.fn, this, arg1, arg2, arg3);

goog.bind(function() {
  return true;
}, this);

goog.bind(function(a, b) {
  return a + b;
}, this, a, b);

var fn = goog.bind(
    /**
     * @param {number} a
     * @param {number} b
     * @return {number}
     */
    function(a, b) {
      return a + b;
    }, this);
