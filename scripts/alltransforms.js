const fs = require('fs');
const path = require('path');

const transformsDir = path.resolve('transforms');

module.exports = (file, api, options) => {
  let src = file.source;

  // get a list of transform files in the transforms directory
  fs.readdirSync(transformsDir).forEach(transformFile => {
    if (!transformFile || typeof src === 'undefined') {
      return;
    }

    // load the transform
    const transform = require(path.join(transformsDir, transformFile));
    if (transform) {
      // apply the transform to the current file
      const nextSrc = transform({
        ...file,
        source: src
      }, api, options);

      // replace the current file's source if returned by the transform
      if (nextSrc) {
        src = nextSrc;
      }
    }
  });

  return src;
};
