/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.4.1 -- 2016-05-25T16:35:15.970Z
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

    this.applyLayout = function (layout) {
      this.layout.css = angular.extend({}, layout.css);
    };

    function moveBefore(element, target) {
      element.detach();
      target.before(element);
    }

    function moveLast(element, target) {
      var parent = element.parent();
      element.detach();
      parent.append(element);
    }

    this.moveBefore = function (target) {
      if (target) {
        moveBefore(header, target.header);
        this.cells.forEach(function (cell, i) {
          return moveBefore(cell, target.cells[i]);
        });
      } else {
        moveLast(header);
        this.cells.forEach(function (cell) {
          return moveLast(cell);
        });
      }
    };

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
    var rowMap = new Map();
    var current = void 0;
    var index = void 0;

    $timeout(function () {
      scrollViewport.adapter.gridAdapter = new GridAdapter(_this);
      scrollViewport.adapter.transform = function (scope, item) {
        return _this.transform(rowMap.get(scope), item);
      };
    });

    this.transform = function (row) {
      var parent = row[0].parent();
      var last = row[row.length - 1].next();
      var visible = [];

      function applyCss(target, css) {
        for (var attr in css) {
          if (css.hasOwnProperty(attr)) target.css(attr, css[attr]);
        }
      };

      columns.forEach(function (column, index) {
        applyCss(row[index], column.layout.css);
        visible[columns[index].mapTo] = row[index];
      });

      var current = visible.shift();
      current.detach();
      if (last.length) last.before(current);else parent.append(current);

      visible.forEach(function (cell) {
        cell.detach();
        current.after(cell);
        current = cell;
      });
    };

    this.registerColumn = function (header) {
      columns.push(new ColumnController(columns, header));
    };

    this.registerCell = function (scope, cell) {
      if (current !== scope) {
        index = 0;
        current = scope;
      }
      if (index < columns.length) {
        columns[index].cells.push(cell);

        var row = rowMap.get(scope);
        if (!row) {
          row = [];
          rowMap.set(scope, row);
        }
        row[index] = cell;

        return index++;
      }
      return -1;
    };

    this.unregisterCell = function (scope, column, cell) {
      var index = columns[column].cells.indexOf(cell);
      columns[column].cells.splice(index, 1);

      var row = rowMap.get(scope);
      var i = row.indexOf(cell);
      row.splice(i, 1);
      if (!row.length) rowMap.delete(scope);
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
          css: angular.extend({}, column.layout.css),
          mapTo: column.mapTo
        });
      });
      return result;
    };

    this.applyLayout = function (layouts) {
      var _this3 = this;

      if (!layouts || layouts.length != columns.length) {
        throw new Error('Failed to apply layout - number of layouts should match number of columns');
      }
      layouts.forEach(function (layout, index) {
        columns[index].applyLayout(layout);
      });
      rowMap.forEach(function (row) {
        _this3.transform(row);
      });
    };

    this.moveBefore = function (selected, target) {
      var index = target;

      if (target % 1 !== 0) index = target ? columns[target.columnId].mapTo : columns.length;

      if (index < 0 || index > columns.length) return; // throw an error?

      var mapTo = selected.mapTo,
          next = void 0;
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
          var index = gridController.registerCell($scope, element);
          if (index >= 0) {
            element.attr('ui-scroll-td', index);
            $scope.$on('$destroy', function () {
              return gridController.unregisterCell($scope, index, element);
            });
          }
        })();
      }
    }
  };
}]);
}());