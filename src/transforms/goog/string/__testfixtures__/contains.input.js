goog.string.contains(someStr, 'test');

if (goog.string.contains(this.someStr, 'test')) {
  // truthy call
}

if (!goog.string.contains(strFn(), 'test')) {
  // falsey call
}
