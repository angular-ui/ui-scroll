/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.5.2 -- 2016-12-15T00:49:38.845Z
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
        controller.forEachRow(function (row) {
          return row[column.id].css(attr, value);
        });
        column.css[attr] = value;
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

  function ColumnController(controller, columns, header) {

    this.header = header;
    this.cells = [];
    this.css = {};
    this.mapTo = columns.length;
    this.id = columns.length;

    // controller api methods

    this.applyLayout = function (layout) {
      this.css = angular.extend({}, layout.css);
      this.mapTo = layout.mapTo;
      applyCss(this.header, this.css);
    };

    this.moveBefore = function (target) {
      var _this = this;

      if (target) {
        moveBefore(header, target.header);
        controller.forEachRow(function (row) {
          return moveBefore(row[_this.id], row[target.id]);
        });
      } else {
        moveLast(header);
        controller.forEachRow(function (row) {
          return moveLast(row[_this.id]);
        });
      }
    };

    this.columnFromPoint = function (x, y) {
      var _this2 = this;

      if (insidePoint(header, x, y)) return this;
      var result = undefined;
      controller.forEachRow(function (row) {
        if (insidePoint(row[_this2.id], x, y)) result = _this2;
      });
      return result;
    };

    this.applyCss = function (target) {
      applyCss(target, this.css);
    };

    // function definitions

    function insidePoint(element, x, y) {
      var offset = element.offset();
      if (x < offset.left || offset.left + element.outerWidth(true) < x) return false;
      if (y < offset.top || offset.top + element.outerHeight(true) < y) return false;
      return true;
    }

    function moveBefore(element, target) {
      element.detach();
      target.before(element);
    }

    function moveLast(element, target) {
      var parent = element.parent();
      element.detach();
      parent.append(element);
    }

    function applyCss(target, css) {
      target.removeAttr('style');
      for (var attr in css) {
        if (css.hasOwnProperty(attr)) target.css(attr, css[attr]);
      }
    };
  }

  function GridController(scope, scrollViewport) {
    var _this3 = this;

    var columns = [];
    var rowMap = new Map();

    $timeout(function () {
      scrollViewport.adapter.gridAdapter = new GridAdapter(_this3);
      scrollViewport.adapter.transform = function (scope, item) {
        return transform(rowMap.get(scope), item);
      };
    });

    this.registerColumn = function (header) {
      columns.push(new ColumnController(this, columns, header));
    };

    this.registerCell = function (scope, cell) {
      var row = rowMap.get(scope);

      if (!row) {
        row = [];
        rowMap.set(scope, row);
      }

      if (row.length >= columns.length) return false;
      row.push(cell);
      return true;
    };

    this.unregisterCell = function (scope, cell) {
      var row = rowMap.get(scope);
      var i = row.indexOf(cell);
      row.splice(i, 1);
      if (!row.length) rowMap.delete(scope);
    };

    this.forEachRow = function (callback) {
      rowMap.forEach(callback);
    };

    this.getColumns = function () {
      var _this4 = this;

      var result = [];
      columns.slice().sort(function (a, b) {
        return a.mapTo - b.mapTo;
      }).forEach(function (column) {
        return result.push(new ColumnAdapter(_this4, column));
      });
      return result;
    };

    this.getLayout = function () {
      var result = [];
      columns.forEach(function (column, index) {
        return result.push({
          index: index,
          css: angular.extend({}, column.css),
          mapTo: column.mapTo
        });
      });
      return result;
    };

    this.applyLayout = function (layouts) {
      if (!layouts || layouts.length != columns.length) {
        throw new Error('Failed to apply layout - number of layouts should match number of columns');
      }
      layouts.forEach(function (layout, index) {
        columns[index].applyLayout(layout);
      });
      transform(columns.map(function (column) {
        return column.header;
      }));
      rowMap.forEach(function (row) {
        transform(row);
      });
    };

    this.moveBefore = function (selected, target) {
      var index = target;

      if (target % 1 !== 0) index = target ? columns[target.columnId].mapTo : columns.length;

      if (index < 0 || index > columns.length) return; // throw an error?

      var mapTo = selected.mapTo,
          next = undefined;
      index -= mapTo < index ? 1 : 0;

      columns.forEach(function (c) {
        c.mapTo -= c.mapTo > mapTo ? 1 : 0;
        c.mapTo += c.mapTo >= index ? 1 : 0;
        next = c.mapTo === index + 1 ? c : next;
      });

      selected.mapTo = index;
      selected.moveBefore(next);
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

    // function definitions

    function transform(row) {
      var parent = row[0].parent();
      var visible = [];

      row.forEach(function (cell, index) {
        columns[index].applyCss(cell);
        visible[columns[index].mapTo] = row[index];
        row[index].detach();
      });

      visible.forEach(function (cell) {
        return parent.append(cell);
      });
    }
  }

  return {
    require: ['^^uiScrollViewport'],
    restrict: 'A',
    link: function link($scope, element, $attr, controllers, linker) {
      controllers[0].gridController = controllers[0].gridController || new GridController($scope, controllers[0]);
      controllers[0].gridController.registerColumn(element);
    }
  };
}]).directive('uiScrollTd', ['$log', function (console) {
  return {
    require: ['?^^uiScrollViewport'],
    restrict: 'A',
    link: function link($scope, element, $attr, controllers, linker) {
      if (controllers[0]) {
        (function () {
          var gridController = controllers[0].gridController;
          if (gridController.registerCell($scope, element)) {
            $scope.$on('$destroy', function () {
              return gridController.unregisterCell($scope, element);
            });
          }
        })();
      }
    }
  };
}]);
}());