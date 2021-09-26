const Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs'));
const mkdirp = require('mkdirp');
const path = require('path');

const {getDependencies, loadDeps} = require('../utils/goog');

(async () => {
  const countMap = {};

  loadDeps(false);

  const deps = getDependencies(true);
  for (const key in deps) {
    const dep = deps[key];
    if (dep.requires) {
      dep.requires.forEach((r) => {
        if (/^(os|plugin)\./.test(r)) {
          if (!(r in countMap)) {
            countMap[r] = 1;
          } else {
            countMap[r]++;
          }
        }
      });
    }
  }

  const requires = Object.keys(countMap);
  requires.sort((a, b) => {
    const countDiff = countMap[b] - countMap[a];
    if (countDiff !== 0) {
      return countDiff;
    }

    return a > b ? 1 : b > a ? -1 : 0;
  });

  const output = requires.map((r) => `${r}: ${countMap[r]}`).join('\n');

  const buildDir = path.join(process.cwd(), '.build');
  await mkdirp(buildDir);
  await fs.writeFileAsync(
    path.join(buildDir, 'module-usage.csv'),
    output
  );
})();
