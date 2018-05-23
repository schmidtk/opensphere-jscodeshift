'use strict';

const fs = require('fs');
const expect = require('chai').expect;

describe('goog', () => {
  it('should replace goog.isDef calls', function() {
    const expected = fs.readFileSync('./test/goog-isdef.expected.js', 'utf8');
    const actual = fs.readFileSync('./.build/test/goog-isdef.input.js', 'utf8');
    expect(actual).to.equal(expected);
  });

  it('should replace goog.isNull calls', function() {
    const expected = fs.readFileSync('./test/goog-isnull.expected.js', 'utf8');
    const actual = fs.readFileSync('./.build/test/goog-isnull.input.js', 'utf8');
    expect(actual).to.equal(expected);
  });

  it('should replace goog.isDefAndNotNull calls', function() {
    const expected = fs.readFileSync('./test/goog-isdefandnotnull.expected.js', 'utf8');
    const actual = fs.readFileSync('./.build/test/goog-isdefandnotnull.input.js', 'utf8');
    expect(actual).to.equal(expected);
  });

  it('should replace goog.exportProperty calls', function() {
    const expected = fs.readFileSync('./test/goog-exportproperty.expected.js', 'utf8');
    const actual = fs.readFileSync('./.build/test/goog-exportproperty.input.js', 'utf8');
    expect(actual).to.equal(expected);
  });
});
