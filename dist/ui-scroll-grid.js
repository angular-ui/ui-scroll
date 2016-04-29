/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.4.1 -- 2016-04-29T12:21:34.640Z
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

  function GridAdapter() {
    var headers = [];
    var current;
    var index;

    //controllers[0].adapter.gridAdapter = this;

    this.registerHeader = function (header) {
      headers.push({
        header: header,
        cells: [],
        observer: new MutationObserver(function (mutations) {
          console.log(mutations);
        })
      });
    };

    this.registerCell = function (scope, cell) {
      if (current !== scope) {
        index = 0;
        current = scope;
      }
      if (index < headers.length) {
        headers[index].observer.observe(cell[0], { attributes: true, attributeOldValue: true });
        headers[index].cells.push(cell);
        headers[index].header.css('width', window.getComputedStyle(cell[0]).width);
        return index++;
      }
      return -1;
    };

    this.unregisterCell = function (column, cell) {
      var index = headers[column].cells.indexOf(cell);
      headers[column].cells.splice(index, 1);
    };
  }

  return {
    require: ['^uiScrollViewport'],
    link: { pre: function pre() {}, post: function post($scope, element, $attr, controllers, linker) {

        gridAdapter = controllers[0].gridAdapter = controllers[0].gridAdapter || new GridAdapter();
        gridAdapter.registerHeader(element);
      } }
  };
}]).directive('uiScrollTd', ['$log', function (console) {
  return {
    require: ['?^^uiScrollViewport'],
    link: function link($scope, element, $attr, controllers, linker) {
      if (controllers[0]) {
        gridAdapter = controllers[0].gridAdapter;
        var index = gridAdapter.registerCell($scope, element);
        if (index >= 0) {
          element.attr('ui-scroll-td', index);
          $scope.$on('$destroy', function () {
            gridAdapter.unregisterCell(index, element);
          });
        }
      }
    }
  };
}]);
}());