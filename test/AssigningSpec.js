/*global describe, beforeEach, module, it, expect */
describe('uiScroll', function () {
    'use strict';

    beforeEach(module('ui.scroll'));
    beforeEach(module('ui.scroll.test.datasources'));

    var myApp = angular.module('myApp',[]);
    myApp.controller('MyTopController', function($scope) {
        $scope.name = 'MyTopController';
    });
    myApp.controller('MyInnerController', function($scope) {
        $scope.name = 'MyInnerController';
        $scope.container = {};
    });
    myApp.controller('MyBottomController', function($scope) {
        $scope.name = 'MyBottomController';
        $scope.container = {};
    });

    beforeEach(module('myApp'));

    var setDirective = function(options) {
        return function() {
            var directive = {
                restrict: 'E',
                scope: true,
                controller: function($scope) {
                    this.show = true;
                    this.container = {};
                    $scope.container = {};
                }
            };
            if (options.ctrlAs) {
                directive.controllerAs = options.ctrlAs;
            }
            directive.template = options.template;
            return directive;
        };
    };

    var executeTest = function(template, scopeSelector, scopeContainer) {
        inject(function($rootScope, $compile, $timeout) {
            // build and render
            var templateElement = angular.element(template);
            var scope = $rootScope.$new();
            angular.element(document).find('body').append(templateElement);
            $compile(templateElement)(scope);
            scope.$apply();
            $timeout.flush();

            // find adapter element and scope container
            var adapterContainer;
            if(scopeSelector) {
                var adapterElement;
                if(typeof scopeSelector === 'string') {
                  adapterElement = templateElement.find('[ng-controller="' + scopeSelector + '"]');
                }
                else { //number
                    adapterElement = templateElement.find('my-dir' + scopeSelector);
                }
                adapterContainer = adapterElement.scope();
            }
            else {
                adapterContainer = $rootScope;
            }
            if (scopeContainer) {
               adapterContainer = adapterContainer[scopeContainer];
            }

            // expectations
            expect(!!adapterContainer.adapter).toBe(true);
            expect(angular.isString(adapterContainer.adapter.topVisible)).toBe(true);

            // clean up
            templateElement.remove();
        });
    };

    describe('Adapter assigning', function () {

        it('should work in simplest case (viewport)', function () {
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController">' +
        '<div ng-controller="MyBottomController">' +
            '<div ui-scroll-viewport style="height: 200px">' +
                '<div ui-scroll="item in myMultipageDatasource" adapter="adapter">' +
                    '{{$index}}: {{item}}' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 'MyBottomController');
        });

        it('should work in simplest case (no viewport)', function () {
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController" ng-if="name">' +
        '<div ng-controller="MyBottomController" ng-if="name">' +
            '<div ui-scroll="item in myMultipageDatasource" adapter="adapter">' +
                '{{$index}}: {{item}}' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 'MyBottomController');
        });

        it('should work with additional container (viewport)', function () {
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController">' +
        '<div ng-controller="MyBottomController">' +
            '<div ui-scroll-viewport style="height: 200px">' +
                '<div ui-scroll="item in myMultipageDatasource" adapter="ctrl.adapter">' +
                    '{{$index}}: {{item}}' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 'MyBottomController', 'ctrl');
        });

        it('should work with additional container (no viewport)', function () {
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController" ng-if="name">' +
        '<div ng-controller="MyBottomController" ng-if="name">' +
            '<div ui-scroll="item in myMultipageDatasource" adapter="ctrl.adapter">' +
                '{{$index}}: {{item}}' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 'MyBottomController', 'ctrl');
        });

        it('should work for "on" syntax (viewport)', function () {
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController" ng-if="name">' +
        '<div ng-controller="MyBottomController" ng-if="name">' +
            '<div ui-scroll-viewport style="height: 200px" ng-if="name">' +
                '<div ui-scroll="item in myMultipageDatasource" adapter="adapter on MyInnerController">' +
                    '{{$index}}: {{item}}' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 'MyInnerController');
        });

        it('should work for "on" syntax (no viewport)', function () {
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController" ng-if="name">' +
        '<div ng-controller="MyBottomController" ng-if="name">' +
            '<div ui-scroll="item in myMultipageDatasource" adapter="adapter on MyInnerController">' +
                '{{$index}}: {{item}}' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 'MyInnerController');
        });

        it('should work for "Controller As" syntax (viewport)', function () {
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController as ctrl" ng-if="name">' +
        '<div ng-controller="MyBottomController" ng-if="name">' +
            '<div ui-scroll-viewport style="height: 200px" ng-if="name">' +
                '<div ui-scroll="item in myMultipageDatasource" adapter="ctrl.adapter">' +
                    '{{$index}}: {{item}}' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 'MyInnerController as ctrl', 'ctrl');
        });

        it('should work for "Controller As" syntax (no viewport)', function () {
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController as ctrl" ng-if="name">' +
        '<div ng-controller="MyBottomController" ng-if="name">' +
            '<div ui-scroll="item in myMultipageDatasource" adapter="ctrl.adapter">' +
                '{{$index}}: {{item}}' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 'MyInnerController as ctrl', 'ctrl');
        });

        it('should work for custom directive with "Controller As" syntax (viewport)', function () {
            myApp.directive('myDir1', setDirective({
              ctrlAs: 'ctrl',
              template:
'<div ui-scroll-viewport style="height:200px" ng-if="ctrl.show">' +
    '<div ui-scroll="item in myMultipageDatasource" adapter="ctrl.adapter">' +
        '{{$index}}: {{item}}' +
    '</div>' +
'</div>'
            }));
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController" ng-if="name">' +
        '<div ng-controller="MyBottomController" ng-if="name">' +
            '<my-dir1></my-dir1>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 1, 'ctrl');
        });

        it('should work for custom directive with "Controller As" syntax (no viewport)', function () {
            myApp.directive('myDir2', setDirective({
              ctrlAs: 'ctrl',
              template:
'<div style="height:200px" ng-if="ctrl.show">' +
    '<div ui-scroll="item in myMultipageDatasource" adapter="ctrl.adapter">' +
        '{{$index}}: {{item}}' +
    '</div>' +
'</div>'
            }));
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController" ng-if="name">' +
        '<div ng-controller="MyBottomController" ng-if="name">' +
            '<my-dir2></my-dir2>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 2, 'ctrl');
        });

        it('should work for custom directive with the adapter defined on some external controller', function () {
            myApp.directive('myDir3', setDirective({
              ctrlAs: 'ctrl2',
              template:
'<div ui-scroll-viewport style="height:200px" ng-if="ctrl2.show">' +
    '<div ui-scroll="item in myMultipageDatasource" adapter="ctrl.adapter">' +
        '{{$index}}: {{item}}' +
    '</div>' +
'</div>'
            }));
            var template =
'<div ng-controller="MyTopController">' +
    '<div ng-controller="MyInnerController as ctrl" ng-if="name">' +
        '<div ng-controller="MyBottomController" ng-if="name">' +
            '<my-dir3></my-dir3>' +
        '</div>' +
    '</div>' +
'</div>';
            executeTest(template, 'MyInnerController as ctrl', 'ctrl');
        });
    });

});
