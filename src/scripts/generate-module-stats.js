const Promise = require('bluebird');

const config = require('config');
const fs = Promise.promisifyAll(require('fs'));
const mkdirp = require('mkdirp');
const path = require('path');

const {getDependencies, loadDeps} = require('../utils/goog');

(async () => {
  const dirs = {};
  const packages = {};

  const dirHeaders = ['Directory,ES6,Goog,Legacy,Shim'];
  const packageHeaders = ['Package,ES6,Goog,Legacy,Shim'];

  const ignoredPackages = config.has('stats.ignoredPackages') ? config.get('stats.ignoredPackages') : [];
  const seenPaths = {};

  const generateStats = (header, stats) => {
    const outputLines = [
      header,
      ...Object.keys(stats).sort().map((key) => `${key},${stats[key].es6},${stats[key].goog},${stats[key].legacy},${stats[key].shim}`)
    ];

    return outputLines.join('\n');
  };

  const getStatsObject = (baseObj, key) => {
    if (!baseObj[key]) {
      baseObj[key] = {
        es6: 0,
        goog: 0,
        legacy: 0,
        shim: 0
      };
    }
    return baseObj[key];
  };

  loadDeps(false);

  const deps = getDependencies(true);
  for (const key in deps) {
    const dep = deps[key];
    if (!ignoredPackages.some((pkg) => dep.path.startsWith(`${pkg}/`)) && !seenPaths[dep.path]) {
      // Deps are indexed by namespace, so provides may have multiple per file.
      seenPaths[dep.path] = true;

      const dirName = path.dirname(dep.path);
      const dirStats = getStatsObject(dirs, dirName);

      const pathParts = dep.path.split(path.sep);
      let packageName = pathParts.shift();
      if (packageName.startsWith('@')) {
        packageName = `${packageName}/${pathParts.shift()}`;
      }

      const packageStats = getStatsObject(packages, packageName);

      let moduleType = dep.moduleType || 'legacy';
      if (dep.path.endsWith('_shim.js')) {
        moduleType = 'shim';
      }

      if (Object.prototype.hasOwnProperty.call(dirStats, moduleType)) {
        dirStats[moduleType]++;
        packageStats[moduleType]++;
      }
    }
  }

  const buildDir = path.join(process.cwd(), '.build');
  await mkdirp(buildDir);
  await fs.writeFileAsync(
    path.join(buildDir, 'module-stats-dirs.csv'),
    generateStats(dirHeaders, dirs)
  );
  await fs.writeFileAsync(
    path.join(buildDir, 'module-stats-packages.csv'),
    generateStats(packageHeaders, packages)
  );
})();
