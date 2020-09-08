const {console} = require('./logger');
const {addOSGlobals} = require('./opensphere');

// reduce log level for tests
console.level = 'error';

// override with test-only configs for OSGlobals
addOSGlobals({
  "test.os.feature": {},
  "test.os.ui": {},
  "os.alertManager": {"require": "os.alert.AlertManager", "singleton": true},
  "os.settings": {"require": "os.config.Settings", "singleton": true},
}, true);
