# OpenSphere Code Transforms

[`jscodeshift`](https://github.com/facebook/jscodeshift) scripts designed to migrate OpenSphere code toward ES6 modules, by performing abstract syntax tree (AST) transforms on JavaScript.

## Generating Usage Info

To generate a listing of Closure Library usage in a source directory:

```
SRC_DIR=<root dir> yarn run usage
```

This will create `.build/goog-usage`, with a list of `goog.*` references and their ref counts.

## Running Transforms

Run a transform against a project's source:

```
yarn run shift -t src/transforms/<transform>.js <input>
```

The input parameter can either be a single file, or a directory. Directories will be searched recursively for JavaScript files and all files will be modified.

By default, `jscodeshift` will modify input files in-place. To skip changing files and output the result of changes to the console:

```
yarn run dryrun -t src/transforms/<transform>.js <input>
```

All modified sources will be dumped in full to the console, so it's highly recommended to only do this on individual files instead of entire directories.

## Development Resources

[`jscodeshift`](https://github.com/facebook/jscodeshift) is largely a wrapper around [`recast`](https://github.com/benjamn/recast). The `jscodeshift` repo has some API documentation available and links to a few other resources, but to some extent learning to use it will require browsing their code and a bit of Googling. Below are some resources that may be useful in this process.

- [AST Explorer](http://astexplorer.net/): Shows the abstract syntax tree of your code, and supports running jscodeshift transforms directly and displaying the result. Set the parser (`</>` button) to `esprima`, the parser used by `recast`.
- [awesome-jscodeshift](https://github.com/sejoker/awesome-jscodeshift): Compilation of `jscodeshift` resources.
- [List of API calls](https://github.com/RReverser/esprima_ast_explorer/blob/master/website/src/defs/jscodeshift.json): The closest thing to an API I could find for creating AST objects with JSCS.

## Tests

See the [Unit Testing](https://github.com/facebook/jscodeshift#unit-testing) docs for `jscodeshift` for details on how to add tests for transforms.

## Debugging

To inspect transforms, add a `debugger` statement wherever you would like to set a breakpoint. Load `chrome://inspect`, click `Open dedicated DevTools for Node`, then run:

```
yarn run inspect -t <transform> <test file>
```

The Node process will automatically attach and break on the first line. Run the process and it will hit your first `debugger` statement.
