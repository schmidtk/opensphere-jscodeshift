goog.module('os.ns.MyComponentCtrl');
goog.module.declareLegacyNamespace();
goog.module('os.ns.myComponentDirective');

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
    controller: MyComponentCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('my-component', [os.ns.myComponentDirective]);


/**
 * Test controller.
 */
class MyComponentCtrl extends os.ns.ParentCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super();

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

    $scope.$on('someEvent', MyComponentCtrl.staticFn_);
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   * @private
   */
  destroy_() {
    os.alertManager.unlisten(os.alert.EventType.ALERT, this.registerAlert_, false, this);
    this.scope_ = null;
  }

  /**
   * A function on the class.
   * @param {string} arg1 First arg.
   * @param {number=} opt_arg2 Optional second arg.
   * @return {boolean}
   */
  memberFn(arg1, opt_arg2) {
    if (arg1 === MyComponentCtrl.CONSTANT) {
      goog.log.fine(MyComponentCtrl.LOGGER_, 'Some message');
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  overrideFn(arg1, opt_arg2) {
    return super.overrideFn(arg1);
  }

  /**
   * @inheritDoc
   */
  oldOverrideFn(arg1, opt_arg2) {
    return super.oldOverrideFn(arg1);
  }

  /**
   * @inheritDoc
   */
  oldOverrideDifferentClass(arg1, opt_arg2) {
    // can't convert due to difference in class
    return os.ns.AnotherClass.superClass_.oldOverrideDifferentClass.call(this, arg1);
  }

  /**
   * @param {angular.Scope.Event} evt The angular event
   * @param {string} type The event type to send
   * @private
   */
  static staticFn_(evt, type) {
    os.dispatcher.dispatchEvent(type);
  }
}


/**
 * @inheritDoc
 */
MyComponentCtrl.prototype.overrideToExpression = goog.nullFunction;


exports = MyComponentCtrl;