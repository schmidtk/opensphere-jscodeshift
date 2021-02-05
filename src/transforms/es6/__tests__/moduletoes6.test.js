'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;
const options = require('../../../utils/options').getDefaultTestOptions();

defineTest(__dirname, 'moduletoes6', options, 'closureclass-es6');
defineTest(__dirname, 'moduletoes6', options, 'enum-es6');
defineTest(__dirname, 'moduletoes6', options, 'namespace-es6');
defineTest(__dirname, 'moduletoes6', options, 'ui-es6');
