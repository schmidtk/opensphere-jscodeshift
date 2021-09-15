const jscs = require('jscodeshift');

const isUnassigned = (importDecl) => importDecl.specifiers.length === 0;

const isExternal = (importDecl) => /^[a-zA-Z]/.test(importDecl.source.value);

const isRelative = (importDecl) => importDecl.source.value.startsWith('./');

const isParentRelative = (importDecl) => importDecl.source.value.startsWith('../');

const matchers = {
  'unassigned': isUnassigned,
  'external': isExternal,
  'relative': isRelative,
  'parentRelative': isParentRelative,
  'other': () => true
};

const getImportGroup = (importDecl) => {
  for (const key in matchers) {
    if (matchers[key](importDecl)) {
      return key;
    }
  }

  return 'other';
};

const sortValues = (a, b) => {
  const aValue = a.source.value;
  const bValue = b.source.value;
  return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
};

/**
 * Sort import declarations.
 * @param {Node} root The root node.
 */
const sortImports = (root) => {
  const imports = root.find(jscs.ImportDeclaration);
  if (imports.length) {
    const buckets = {};

    imports.nodes().slice().forEach((n) => {
      const group = getImportGroup(n);
      if (!buckets[group]) {
        buckets[group] = [n];
      } else {
        buckets[group].push(n);
      }
    });

    const importNodes = [];
    for (const key in matchers) {
      if (key in buckets) {
        buckets[key].sort(sortValues);
        importNodes.push(...buckets[key]);
      }
    }
  
    imports.forEach((path, idx, arr) => {
      jscs(path).replaceWith(importNodes[idx]);
    });
  }
};

module.exports = {
  sortImports
};
