'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;
const options = require('../../../utils/options').getDefaultTestOptions();

defineTest(__dirname, 'replaceglobals', options, 'globals');
