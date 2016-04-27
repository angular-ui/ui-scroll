/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.4.1 -- 2016-04-27T21:29:54.138Z
 * License: MIT
 */
 

 (function () {
'use strict';

/*!
 globals: angular, window

 List of used element methods available in JQuery but not in JQuery Lite

 element.before(elem)
 element.height()
 element.outerHeight(true)
 element.height(value) = only for Top/Bottom padding elements
 element.scrollTop()
 element.scrollTop(value)
 */
angular.module('ui.scroll.grid', []).directive('uiScrollTh', ['$log', function (console) {
  return {
    require: ['^uiScrollViewport'],
    link: function link($scope, element, $attr, controllers, linker) {

      function GridAdapter() {
        var headers = [];
        var columns = [];
        this.registerHeader = function (header) {
          headers.push(header);
        };
        this.registerColumn = function (column) {
          headers.push(column);
          console.log(column);
        };
      }

      gridAdapter = controllers[0].gridAdapter = controllers[0].gridAdapter || new GridAdapter();
      gridAdapter.registerHeader(element);
    }
  };
}]).directive('uiScrollTd', ['$log', function (console) {
  return {
    require: ['?^^uiScrollViewport'],
    link: function link($scope, element, $attr, controllers, linker) {

      gridAdapter = controllers[0].gridAdapter;
      gridAdapter.registerColumn(element);
    }
  };
}]);
}());