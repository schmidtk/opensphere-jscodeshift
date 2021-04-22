goog.provide('os.ns.myComponentDirective');

goog.require('os.ns.MyComponentCtrl');
goog.require('os.ui.Module');


/**
 * Test directive.
 * @return {angular.Directive}
 */
os.ns.myComponentDirective = function() {
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
os.ui.Module.directive('myComponent', [os.ns.myComponentDirective]);
