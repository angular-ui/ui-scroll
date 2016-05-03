/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.4.1 -- 2016-05-03T19:57:43.444Z
 * License: MIT
 */
 

 (function () {
'use strict';

angular.module('ui.scroll.grid', []).directive('uiScrollTh', ['$log', '$timeout', function (console, $timeout) {

  function GridAdapter(controller) {
    this.columnWidth = function (column, width) {
      controller.columnWidth(column, width);
    };
  }

  function GridController(scope, scrollViewport) {
    var _this = this;

    var columns = [];
    var current;
    var index;

    $timeout(function () {
      scrollViewport.adapter.gridAdapter = new GridAdapter(_this);
      /*
        scope.$watch(() => scrollViewport.adapter.isLoading, (newValue, oldValue) => {
          if (newValue)
            return;
          columns.forEach((column) => {
            if (column.cells.length)
              column.header.css('width', window.getComputedStyle(column.cells[0][0]).width);   
          });
        });
        */
    });

    this.columnWidth = function (column, width) {
      columns[column].header.css('width', width);
      columns[column].cells.forEach(function (cell) {
        cell.css('width', width);
      });
    };

    this.registerColumn = function (header) {
      columns.push({
        header: header,
        cells: []
      });
    };

    this.registerCell = function (scope, cell) {
      if (current !== scope) {
        index = 0;
        current = scope;
      }
      if (index < columns.length) {
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
    require: ['^^uiScrollViewport'],
    link: function link($scope, element, $attr, controllers, linker) {

      var gridController = controllers[0].gridController = controllers[0].gridController || new GridController($scope, controllers[0]);
      gridController.registerColumn(element);
    }
  };
}]).directive('uiScrollTd', ['$log', function (console) {
  return {
    require: ['?^^uiScrollViewport'],
    link: function link($scope, element, $attr, controllers, linker) {
      if (controllers[0]) {
        var gridController = controllers[0].gridController;
        var index = gridController.registerCell($scope, element);
        if (index >= 0) {
          element.attr('ui-scroll-td', index);
          $scope.$on('$destroy', function () {
            gridController.unregisterCell(index, element);
          });
        }
      }
    }
  };
}]);
}());