const jscs = require('jscodeshift');

const isUnassigned = (importDecl) => importDecl.specifiers.length === 0;

const isExternal = (importDecl) => /^[a-zA-Z]/.test(importDecl.source.value);

const isParentRelative = (importDecl) => importDecl.source.value.startsWith('../');

const isRelative = (importDecl) => /^\.\/(?!index\.js)/.test(importDecl.source.value);

const matchers = {
  'unassigned': isUnassigned,
  'external': isExternal,
  'parentRelative': isParentRelative,
  'relative': isRelative,
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
 * Get the sorted list of import nodes.
 * @param {Collection} imports The collection of imports.
 * @return {Array<Node>} The sorted import nodes.
 */
const getSortedImportNodes = (imports) => {
  const importNodes = [];

  if (imports.length) {
    const buckets = {};

    // Bucket nodes by import group.
    imports.nodes().slice().forEach((n) => {
      const group = getImportGroup(n);
      if (!buckets[group]) {
        buckets[group] = [n];
      } else {
        buckets[group].push(n);
      }
    });

    // Sort each group and add them to the overall sorted list.
    for (const key in matchers) {
      if (key in buckets) {
        buckets[key].sort(sortValues);
        importNodes.push(...buckets[key]);
      }
    }
  }

  return importNodes;
}

/**
 * Sort import declarations. Imports will be grouped by import type, and sorted by import path within each group.
 * @param {Node} root The root node.
 * @return {boolean} If the order changed.
 */
const sortImports = (root) => {
  let changed = false;

  const imports = root.find(jscs.ImportDeclaration);
  const importNodes = getSortedImportNodes(imports);
  if (importNodes.length) {
    // Update imports in the source so they're in sorted order.
    imports.forEach((path, idx, arr) => {
      const target = importNodes[idx];
      if (target !== path.value) {
        jscs(path).replaceWith(target);
        changed = true;
      }
    });
  }

  return changed;
};

module.exports = {
  getSortedImportNodes,
  sortImports
};
