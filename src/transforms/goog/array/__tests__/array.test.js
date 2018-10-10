'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;

defineTest(__dirname, 'clear', {});
defineTest(__dirname, 'find', {});
defineTest(__dirname, 'foreach', {});
