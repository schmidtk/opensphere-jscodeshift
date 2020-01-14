'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;

defineTest(__dirname, 'providetomodule', {dry: true}, 'closureclass');
defineTest(__dirname, 'providetomodule', {dry: true}, 'interface');
defineTest(__dirname, 'providetomodule', {dry: true}, 'ui');
