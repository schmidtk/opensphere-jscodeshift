'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;

defineTest(__dirname, 'clear', {});
defineTest(__dirname, 'foreach', {});
defineTest(__dirname, 'ol', {});
