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
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'my-component';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

exports = {
  directive,
  directiveTag
};
