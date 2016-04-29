/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.4.1 -- 2016-04-29T19:17:54.800Z
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
angular.module('ui.scroll.grid', []).directive('uiScrollTh', ['$log', '$timeout', function (console, $timeout) {

  function GridAdapter(scope, scrollViewport) {
    var _this = this;

    var columns = [];
    var current;
    var index;

    $timeout(function () {
      scrollViewport.adapter.gridAdapter = _this;
      scope.$watch(function () {
        return scrollViewport.adapter.isLoading;
      }, function (newValue, oldValue) {
        if (newValue) return;
        columns.forEach(function (column) {
          if (column.cells.length) column.header.css('width', window.getComputedStyle(column.cells[0][0]).width);
        });
      });
    });

    this.registerColumn = function (header) {
      columns.push({
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
      if (index < columns.length) {
        columns[index].observer.observe(cell[0], { attributes: true, attributeOldValue: true, attributeFilter: ['width'] });
        columns[index].cells.push(cell);
        return index++;
      }
      return -1;
    };

    this.unregisterCell = function (column, cell) {
      var index = columns[column].cells.indexOf(cell);
      columns[column].cells.splice(index, 1);
    };
  }

  return {
    require: ['^uiScrollViewport'],
    link: function link($scope, element, $attr, controllers, linker) {

      gridAdapter = controllers[0].gridAdapter = controllers[0].gridAdapter || new GridAdapter($scope, controllers[0]);
      gridAdapter.registerColumn(element);
    }
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