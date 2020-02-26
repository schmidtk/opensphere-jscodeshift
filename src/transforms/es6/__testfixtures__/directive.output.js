goog.module('os.ns.myComponentDirective');
goog.module.declareLegacyNamespace();

const MyComponentCtrl = goog.require('os.ns.MyComponentCtrl');
const Module = goog.require('os.ui.Module');


/**
 * Test directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: os.ROOT + 'views/mycomponent.html',
  controller: MyComponentCtrl,
  controllerAs: 'ctrl'
});


/**
 * Add the directive to the module
 */
Module.directive('my-component', [directive]);
exports = directive;
