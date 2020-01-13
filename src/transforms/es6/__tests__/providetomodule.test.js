'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;

defineTest(__dirname, 'providetomodule', {}, 'closureclass');
defineTest(__dirname, 'providetomodule', {}, 'ui');
