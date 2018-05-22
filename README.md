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
yarn run shift:dry -t transforms/<transform>.js <input>
```

All modified sources will be dumped in full to the console, so it's highly recommended to only do this on individual files instead of entire directories.

## Development

When developing transforms, [AST Explorer](http://astexplorer.net/) is a very useful site for determining how to modify the AST to meet your needs.

## Testing

Put test code for transforms in the `test` directory. Running `yarn test` will copy all tests to `.build/test` and run all transforms against them. Inspect files to view the result of these transformations.

Please do not run `yarn shift` or `jscodeshift` directly against test files, as it will modify them in-place. Use `npm run test`, which will copy them to `.build/test` and run all transforms against the copies.
