goog.module('os.ns.myComponentDirective');
goog.module.declareLegacyNamespace();

goog.require('os.ns.MyComponentCtrl');
goog.require('os.ui.Module');


/**
 * Test directive.
 * @return {angular.Directive}
 */
const directive = () => {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/mycomponent.html',
    controller: os.ns.MyComponentCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('my-component', [directive]);
exports = directive;
