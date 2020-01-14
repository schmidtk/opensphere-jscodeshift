'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;
const options = require('../../../utils/options').getDefaultTestOptions();

defineTest(__dirname, 'providetomodule', options, 'closureclass');
defineTest(__dirname, 'providetomodule', options, 'controller');
defineTest(__dirname, 'providetomodule', options, 'directive');
defineTest(__dirname, 'providetomodule', options, 'interface');
defineTest(__dirname, 'providetomodule', options, 'ui');
