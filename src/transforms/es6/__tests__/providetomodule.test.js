'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;
const options = require('../../../utils/options').getDefaultTestOptions();

defineTest(__dirname, 'providetomodule', options, 'closureclass');
defineTest(__dirname, 'providetomodule', options, 'controller');
defineTest(__dirname, 'providetomodule', options, 'defines');
defineTest(__dirname, 'providetomodule', options, 'directive');
defineTest(__dirname, 'providetomodule', options, 'enum');
defineTest(__dirname, 'providetomodule', options, 'interface');
defineTest(__dirname, 'providetomodule', options, 'multiprovidesclass');
defineTest(__dirname, 'providetomodule', options, 'multiprovidesnoref');
defineTest(__dirname, 'providetomodule', options, 'namespace');
defineTest(__dirname, 'providetomodule', options, 'requirevars');
defineTest(__dirname, 'providetomodule', options, 'resolvethis');
defineTest(__dirname, 'providetomodule', options, 'singlenamespace');
defineTest(__dirname, 'providetomodule', options, 'ui');
