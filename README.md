# OpenSphere Code Transforms

Scripts designed to migrate OpenSphere code toward ES6 modules, by performing abstract syntax tree (AST) transforms on JavaScript.

## Usage

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

`jscodemod` is largely a wrapper around [`recast`](https://github.com/benjamn/recast), and neither API is particularly well documented. Learning what's available is generally a practice of looking at existing examples, playing in the debugger, and searching something obscure in Google + 🙏. Below are some resources that may be useful in this process.

- [AST Explorer](http://astexplorer.net/): Shows the abstract syntax tree of your code, and supports running jscodeshift transforms directly and displaying the result.
- [js-codemod](https://github.com/cpojer/js-codemod/): Codemod scripts to transform code to next generation JS.
- [js-transforms](https://github.com/jhgg/js-transforms): Some documented codemod experiments to help you learn.

## Tests

Tests are generally created by doing the following:

1. Create a test file called `test/my-transform.test.js`.
2. Create an input file to transform called `test/my-transform.input.js`.
3. (Optional) Create an expected output file called `test/my-transform.expected.js`.

Running `yarn test` will copy all input files to `.build/test` and run all transforms against them. Tests should compare the result against the expected output.

Note: Please do not run `yarn shift` or `jscodeshift` directly against test files, as it will modify them in-place. Use `yarn test`, which will copy them to `.build/test` and run all transforms against the copies. You can also use `yarn run dryrun` to quickly test the result of a transform against a test file and output the result to the console.

## Debugging

To inspect transforms, load `chrome://inspect`, click `Open dedicated DevTools for Node`, then run:

```
yarn run inspect -t <transform> <test file>
```

The Node process will automatically attach and break on the first line. Run the process once so all files are loaded, open your transform in Sources, set a breakpoint, then run `yarn run inspect` again.
