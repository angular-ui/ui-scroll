/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.4.1 -- 2016-05-20T16:06:28.403Z
 * License: MIT
 */
 

 (function () {
'use strict';

angular.module('ui.scroll.grid', []).directive('uiScrollTh', ['$log', '$timeout', function (console, $timeout) {

  function GridAdapter(controller) {

    this.getLayout = function () {
      return controller.getLayout();
    };

    this.applyLayout = function (layout) {
      return controller.applyLayout(layout);
    };

    this.columnFromPoint = function (x, y) {
      return controller.columnFromPoint(x, y);
    };

    Object.defineProperty(this, 'columns', { get: function get() {
        return controller.getColumns();
      } });
  }

  function ColumnAdapter(controller, column) {

    this.css = function () /* attr, value */{
      var attr = arguments[0];
      var value = arguments[1];
      if (arguments.length == 1) {
        return column.header.css(attr);
      }
      if (arguments.length == 2) {
        column.header.css(attr, value);
        column.cells.forEach(function (cell) {
          return cell.css(attr, value);
        });
        column.layout.css[attr] = value;
      }
    };

    this.moveBefore = function (index) {
      controller.moveBefore(column, index);
    };

    this.exchangeWith = function (index) {
      controller.exchangeWith(column, index);
    };

    Object.defineProperty(this, 'columnId', { get: function get() {
        return column.id;
      } });
  }

  function ColumnController(columns, header) {

    this.header = header;
    this.cells = [];
    this.layout = { css: {} };
    this.mapTo = columns.length;
    this.id = columns.length;

    this.reset = function () {
      this.header.removeAttr('style');
      this.cells.forEach(function (cell) {
        return cell.removeAttr('style');
      });
    };

    this.moveBefore = function (nextTo) {};

    function insidePoint(element, x, y) {
      var offset = element.offset();
      if (x < offset.left || offset.left + element.outerWidth(true) < x) return false;
      if (y < offset.top || offset.top + element.outerHeight(true) < y) return false;
      return true;
    }

    this.columnFromPoint = function (x, y) {
      if (insidePoint(header, x, y)) return this;
      for (var i = 0; i < this.cells.length; i++) {
        if (insidePoint(this.cells[i], x, y)) return this;
      }
    };
  }

  function GridController(scope, scrollViewport) {
    var _this = this;

    var columns = [];
    var current = void 0;
    var index = void 0;

    $timeout(function () {
      return scrollViewport.adapter.gridAdapter = new GridAdapter(_this);
    });

    this.registerColumn = function (header) {
      columns.push(new ColumnController(columns, header));
    };

    this.applyCss = function (target, css) {
      for (var attr in css) {
        if (css.hasOwnProperty(attr)) target.css(attr, css[attr]);
      }
    };

    this.registerCell = function (scope, cell) {
      if (current !== scope) {
        index = 0;
        current = scope;
      }
      if (index < columns.length) {
        columns[index].cells.push(cell);
        this.applyCss(cell, columns[index].layout.css);
        return index++;
      }
      return -1;
    };

    this.unregisterCell = function (column, cell) {
      var index = columns[column].cells.indexOf(cell);
      columns[column].cells.splice(index, 1);
    };

    this.getColumns = function () {
      var _this2 = this;

      var result = [];
      columns.slice().sort(function (a, b) {
        return a.mapTo - b.mapTo;
      }).forEach(function (column) {
        return result.push(new ColumnAdapter(_this2, column));
      });
      return result;
    };

    this.getLayout = function () {
      var result = [];
      columns.forEach(function (column, index) {
        return result.push({
          index: index,
          layout: { css: angular.extend({}, column.layout.css) },
          mapTo: column.mapTo
        });
      });
      return result;
    };

    this.applyLayout = function (columnDescriptors) {
      var _this3 = this;

      if (!columnDescriptors || !columnDescriptors.length) {
        return console.warn('Nothing to apply.');
      }
      columnDescriptors.forEach(function (columnDescriptor, index) {
        if (index < 0 || index >= columns.length) return;
        var columnAdapter = new ColumnAdapter(_this3, columns[index]);
        columns[index].reset();
        _this3.applyCss(columnAdapter, columnDescriptor.layout.css);
      });
    };

    this.moveBefore = function (selected, index) {
      if (index < 0) return; // throw an error?

      var visible = columns.slice().sort(function (a, b) {
        return a.mapTo - b.mapTo;
      });

      // remove selected from the old position
      visible.splice(selected.mapTo, 1);

      if (selected.mapTo < index) index--;

      // insert selected in the new position
      visible.splice(index, 0, selected);

      visible.forEach(function (column, index) {
        column.mapTo = index;
      });
    };

    this.exchangeWith = function (selected, index) {
      if (index < 0 || index >= columns.length) return;
      columns.find(function (c) {
        return c.mapTo === index;
      }).mapTo = selected.mapTo;
      selected.mapTo = index;
    };

    this.columnFromPoint = function (x, y) {
      for (var i = 0; i < columns.length; i++) {
        var column = columns[i].columnFromPoint(x, y);
        if (column) break;
      }
      if (column) return new ColumnAdapter(this, column);
      return undefined;
    };
  }

  return {
    require: ['^^uiScrollViewport'],
    link: function link($scope, element, $attr, controllers, linker) {
      controllers[0].gridController = controllers[0].gridController || new GridController($scope, controllers[0]);
      controllers[0].gridController.registerColumn(element);
    }
  };
}]).directive('uiScrollTd', ['$log', function (console) {
  return {
    require: ['?^^uiScrollViewport'],
    link: function link($scope, element, $attr, controllers, linker) {
      if (controllers[0]) {
        (function () {
          var gridController = controllers[0].gridController;
          var index = gridController.registerCell($scope, element);
          if (index >= 0) {
            element.attr('ui-scroll-td', index);
            $scope.$on('$destroy', function () {
              return gridController.unregisterCell(index, element);
            });
          }
        })();
      }
    }
  };
}]);
}());