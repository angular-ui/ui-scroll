angular.module('ui.scroll.grid', [])
  .directive('uiScrollTh', ['$log', '$timeout', function (console, $timeout) {

    function GridAdapter(controller) {

      this.getLayout = () => controller.getLayout();

      this.applyLayout = (layout) => controller.applyLayout(layout);

      this.columnFromPoint = (x,y) => controller.columnFromPoint(x,y);

      Object.defineProperty(this, 'columns', {get: () => controller.getColumns()});
    }

    function ColumnAdapter(controller, column) {

      this.css = function (/* attr, value */) {
        var attr = arguments[0];
        var value = arguments[1];
        if (arguments.length == 1) {
          return column.header.css(attr);
        }
        if (arguments.length == 2) {
          column.header.css(attr, value);
          controller.forEachRow((row) => row[column.id].css(attr, value));
          column.css[attr] = value;
        }
      };

      this.moveBefore = function (index) {
        controller.moveBefore(column, index);
      };

      this.exchangeWith = function (index) {
        controller.exchangeWith(column, index);
      };

      Object.defineProperty(this, 'columnId', {get: () => column.id})
    }

    function ColumnController(controller, columns, header) {

      this.header = header;
      this.cells = [];
      this.css = {};
      this.mapTo = columns.length;
      this.id = columns.length;
      
      // controller api methods

      this.applyLayout = function(layout) {
          this.css = angular.extend({}, layout.css);
          this.mapTo = layout.mapTo;
          applyCss(this.header, this.css);
      };

      this.moveBefore = function(target) {
        if (target) {
          moveBefore(header, target.header);
          controller.forEachRow((row) => moveBefore(row[this.id], row[target.id]));
        } else {
          moveLast(header);
          controller.forEachRow((row) => moveLast(row[this.id]));
        }
      };

      this.columnFromPoint = function (x,y) {
        if (insidePoint(header, x,y))
          return this;
        let result;
        controller.forEachRow((row) => { 
          if (insidePoint(row[this.id], x,y))
            result = this;
        });
        return result;
      }; 

      this.applyCss = function(target) {
        applyCss(target, this.css);        
      }

      // function definitions

      function insidePoint(element, x,y) {
        let offset = element.offset();
        if (x < offset.left || offset.left + element.outerWidth(true) < x )
          return false;
        if (y < offset.top || offset.top + element.outerHeight(true) < y )
          return false;
        return true;
      }

      function moveBefore(element, target) {
        element.detach();
        target.before(element);
      }

      function moveLast(element, target) {
        let parent = element.parent();
        element.detach();
        parent.append(element);
      }

      function applyCss (target, css) {
        target.removeAttr('style');
        for (let attr in css)
          if (css.hasOwnProperty(attr))
            target.css(attr, css[attr]);
      };

    }

    function GridController(scope, scrollViewport) {
      let columns = [];
      let rowMap = new Map();

      $timeout(() => {
        scrollViewport.adapter.gridAdapter = new GridAdapter(this);
        scrollViewport.adapter.transform = (scope, item) => transform(rowMap.get(scope), item);
      });

      this.registerColumn = function (header) {
        columns.push(new ColumnController(this, columns, header));
      };

      this.registerCell = function (scope, cell) {
        let row = rowMap.get(scope);

        if (!row) {
          row = [];
          rowMap.set(scope, row);
        }

        if (row.length >= columns.length)
          return false;
        row.push(cell);
        return true;
      };

      this.unregisterCell = function (scope, cell) {
        let row = rowMap.get(scope);
        let i = row.indexOf(cell);
        row.splice(i, 1);
        if (!row.length)
          rowMap.delete(scope);
      };

      this.forEachRow = function (callback) {
        rowMap.forEach(callback);
      };

      this.getColumns = function () {
        let result = [];
        columns.slice().sort((a,b) => {return a.mapTo - b.mapTo;})
          .forEach((column) => result.push(new ColumnAdapter(this, column)));
        return result;
      };

      this.getLayout = function () {
        let result = [];
        columns.forEach((column, index) => result.push({
            index: index,
            css: angular.extend({}, column.css),
            mapTo: column.mapTo
          })
        );
        return result;
      };

      this.applyLayout = function (layouts) {
        if (!layouts || layouts.length != columns.length) {
          throw new Error('Failed to apply layout - number of layouts should match number of columns');
        }
        layouts.forEach((layout, index) => { columns[index].applyLayout(layout); });
        transform(columns.map((column) => {return column.header;}));
        rowMap.forEach((row) => { transform(row); });
      };

      this.moveBefore = function (selected, target) {
        let index = target;

        if (target % 1 !== 0)
          index = target ? columns[target.columnId].mapTo : columns.length;

        if (index < 0 || index > columns.length)
          return; // throw an error?

        let mapTo = selected.mapTo, next;
        index -= mapTo < index ? 1 : 0;

        columns.forEach(c => {
          c.mapTo -= c.mapTo > mapTo ? 1 : 0;
          c.mapTo += c.mapTo >= index ? 1 : 0;
          next = c.mapTo === index + 1 ? c : next;
        });

        selected.mapTo = index;
        selected.moveBefore(next);
      };

      this.exchangeWith = function (selected, index) {
        if (index < 0 || index >= columns.length)
          return;
        columns.find(c => c.mapTo === index).mapTo = selected.mapTo;
        selected.mapTo = index;
      };

      this.columnFromPoint = function(x,y) {
        for (let i=0; i<columns.length; i++) {
          var column = columns[i].columnFromPoint(x,y);
          if (column)
            break;
        }
        if (column)
          return new ColumnAdapter(this, column);
        return undefined;
      };

      // function definitions

      function transform (row) {
        let parent = row[0].parent();
        let visible = [];

        row.forEach((cell, index) => {
          columns[index].applyCss(cell);
          visible[columns[index].mapTo] = row[index];
          row[index].detach();
        });

        visible.forEach(cell => parent.append(cell));
      }

    }

    return {
      require: ['^^uiScrollViewport'],
      restrict: 'A',
      link: ($scope, element, $attr, controllers, linker) => {
        controllers[0].gridController = controllers[0].gridController || new GridController($scope, controllers[0]);
        controllers[0].gridController.registerColumn(element);
      }
    }
  }])

  .directive('uiScrollTd', ['$log', function (console) {
    return {
      require: ['?^^uiScrollViewport'],
      restrict: 'A',
      link: ($scope, element, $attr, controllers, linker) => {
        if (controllers[0]) {
          let gridController = controllers[0].gridController;
          if (gridController.registerCell($scope, element)) {
            $scope.$on('$destroy', () => gridController.unregisterCell($scope, element));
          }
        }
      }
    }
  }]);