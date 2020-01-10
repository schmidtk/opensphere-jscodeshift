goog.provide('os.ns.MyComponentCtrl');
goog.provide('os.ns.myComponentDirective');

goog.require('os.ns.ParentCtrl');
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
os.ui.Module.directive('my-component', [os.ns.myComponentDirective]);


/**
 * Test controller.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ns.ParentCtrl}
 * @constructor
 * @ngInject
 */
os.ns.MyComponentCtrl = function($scope, $element) {
  os.ns.MyComponentCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * The root DOM element.
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * A public property on the class.
   * @type {string}
   */
  this.prop1 = 'Hello';

  /**
   * A protected property on the class.
   * @type {string}
   * @protected
   */
  this.prop2 = 'World';

  /**
   * A private property on the class.
   * @type {string}
   * @private
   */
  this.prop3_ = '!!!';

  /**
   * Property exposed for Angular.
   * @type {string}
   */
  this['exposedProp1'] = 'foo';

  /**
   * Property exposed for Angular.
   * @type {string}
   */
  this['exposedProp2'] = 'bar';

  $scope.$on('someEvent', os.ns.MyComponentCtrl.staticFn_);
  $scope.$on('$destroy', this.destroy_.bind(this));
};
goog.inherits(os.ns.MyComponentCtrl, os.ns.ParentCtrl);


/**
 * Clean up.
 * @private
 */
os.ns.MyComponentCtrl.prototype.destroy_ = function() {
  os.alertManager.unlisten(os.alert.EventType.ALERT, this.registerAlert_, false, this);
  this.scope_ = null;
};


/**
 * A function on the class.
 * @param {string} arg1 First arg.
 * @param {number=} opt_arg2 Optional second arg.
 * @return {boolean}
 */
os.ns.MyComponentCtrl.prototype.memberFn = function(arg1, opt_arg2) {
  if (arg1 === os.ns.MyComponentCtrl.CONSTANT) {
    goog.log.fine(os.ns.MyComponentCtrl.LOGGER_, 'Some message');
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ns.MyComponentCtrl.prototype.overrideFn = function(arg1, opt_arg2) {
  return os.ns.MyComponentCtrl.base(this, 'overrideFn', arg1);
};


/**
 * @inheritDoc
 */
os.ns.MyComponentCtrl.prototype.oldOverrideFn = function(arg1, opt_arg2) {
  return os.ns.MyComponentCtrl.superClass_.oldOverrideFn.call(this, arg1);
};


/**
 * @inheritDoc
 */
os.ns.MyComponentCtrl.prototype.oldOverrideDifferentClass = function(arg1, opt_arg2) {
  // can't convert due to difference in class
  return os.ns.AnotherClass.superClass_.oldOverrideDifferentClass.call(this, arg1);
};


/**
 * @inheritDoc
 */
os.ns.MyComponentCtrl.prototype.overrideToExpression = goog.nullFunction;


/**
 * @param {angular.Scope.Event} evt The angular event
 * @param {string} type The event type to send
 * @private
 */
os.ns.MyComponentCtrl.staticFn_ = function(evt, type) {
  os.dispatcher.dispatchEvent(type);
};
