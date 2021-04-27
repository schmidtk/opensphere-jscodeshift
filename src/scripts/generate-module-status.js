const Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs'));
const mkdirp = require('mkdirp');
const path = require('path');

const {getDependencies} = require('../utils/goog');

(async () => {
  const dirs = {};
  const seenPaths = {};

  const getDirObject = (key) => {
    if (!dirs[key]) {
      dirs[key] = {
        es6: 0,
        goog: 0,
        legacy: 0
      };
    }
    return dirs[key];
  };

  const deps = getDependencies(true);
  for (const key in deps) {
    const dep = deps[key];
    if (dep.path.startsWith('opensphere/') && !seenPaths[dep.path]) {
      // Deps are indexed by namespace, so provides may have multiple per file.
      seenPaths[dep.path] = true;

      const dirName = path.dirname(dep.path);
      const dirObj = getDirObject(dirName);
      const moduleType = dep.moduleType || 'legacy';
      if (Object.prototype.hasOwnProperty.call(dirObj, moduleType)) {
        dirObj[moduleType]++;
      }
    }
  }

  const header = ['Directory,ES6,Goog,Legacy'];
  const outputLines = [
    header,
    ...Object.keys(dirs).sort().map((key) => {
      const dir = dirs[key];
      return `${key},${dir.es6},${dir.goog},${dir.legacy}`;
    })
  ];

  const buildDir = path.join(process.cwd(), '.build');
  await mkdirp(buildDir);

  const outputFile = path.join(buildDir, 'module-status.csv');
  await fs.writeFileAsync(outputFile, outputLines.join('\n'));
})();
