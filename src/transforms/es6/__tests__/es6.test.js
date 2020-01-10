'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;

defineTest(__dirname, 'toes6class', {}, 'closureclass');
defineTest(__dirname, 'toes6class', {}, 'ui');
