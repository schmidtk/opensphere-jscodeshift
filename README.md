# OpenSphere Code Transforms

[`jscodeshift`](https://github.com/facebook/jscodeshift) scripts designed to migrate OpenSphere code toward ES6 modules, by performing abstract syntax tree (AST) transforms on JavaScript.

## Running Transforms

Run a transform against a project's source:

```
yarn run shift -t transforms/<transform>.js <input>
```

The input parameter can either be a single file, or a directory. Directories will be searched recursively for JavaScript files and all files will be modified.

By default, `jscodeshift` will modify input files in-place. To skip changing files and output the result of changes to the console:

```
yarn run dryrun -t transforms/<transform>.js <input>
```

All modified sources will be dumped in full to the console, so it's highly recommended to only do this on individual files instead of entire directories.

## Development Resources

[`jscodeshift`](https://github.com/facebook/jscodeshift) is largely a wrapper around [`recast`](https://github.com/benjamn/recast). The `jscodeshift` repo has some API documentation available and links to a few other resources, but to some extent learning to use it will require browsing their code and a bit of Googling. Below are some resources that may be useful in this process.

- [AST Explorer](http://astexplorer.net/): Shows the abstract syntax tree of your code, and supports running jscodeshift transforms directly and displaying the result.
- [js-codemod](https://github.com/cpojer/js-codemod/): Codemod scripts to transform code to next generation JS.
- [js-transforms](https://github.com/jhgg/js-transforms): Some documented codemod experiments to help you learn.

## Tests

See the [Unit Testing](https://github.com/facebook/jscodeshift#unit-testing) docs for `jscodeshift` for details on how to add tests for transforms.

## Debugging

To inspect transforms, load `chrome://inspect`, click `Open dedicated DevTools for Node`, then run:

```
yarn run inspect -t <transform> <test file>
```

The Node process will automatically attach and break on the first line. Run the process once so all files are loaded, open your transform in Sources, set a breakpoint, then run `yarn run inspect` again.
