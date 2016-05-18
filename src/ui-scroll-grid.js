angular.module('ui.scroll.grid', [])
  .directive('uiScrollTh', ['$log', '$timeout', function (console, $timeout) {

    function GridAdapter(controller) {

      this.getLayout = () => controller.getLayout();

      this.applyLayout = (layout) => controller.applyLayout(layout);

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
          column.cells.forEach((cell) => cell.css(attr, value));
          column.layout.css[attr] = value;
        }
      };

      this.moveBefore = function (index) {
        controller.moveBefore(this, index);
      }
    }

    function GridController(scope, scrollViewport) {
      let columns = [];
      let current;
      let index;

      $timeout(() => scrollViewport.adapter.gridAdapter = new GridAdapter(this));

      this.registerColumn = function (header) {
        columns.push(
          {
            header: header,
            cells: [],
            layout: {css: {}},
            mapTo: columns.length,
            reset: function () {
              this.header.removeAttr('style');
              this.cells.forEach((cell) => cell.removeAttr('style'));
            }
          });
      };

      this.applyCss = function (target, css) {
        for (let attr in css)
          if (css.hasOwnProperty(attr))
            target.css(attr, css[attr]);
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
        let index = columns[column].cells.indexOf(cell);
        columns[column].cells.splice(index, 1);
      };

      this.getColumns = function () {
        let result = [];
        columns.forEach((column) => result.push(new ColumnAdapter(this, column)));
        return result;
      };

      this.getLayout = function () {
        let result = [];
        columns.forEach((column, index) => result.push({
            index: index,
            layout: {css: angular.extend({}, column.layout.css)},
            mapTo: column.mapTo
          })
        );
        return result;
      };

      this.applyLayout = function (columnDescriptors) {
        if (!columnDescriptors || !columnDescriptors.length) {
          return console.warn('Nothing to apply.');
        }
        columnDescriptors.forEach((columnDescriptor, index) => {
          if (index < 0 || index >= columns.length)
            return;
          let columnAdapter = new ColumnAdapter(this, columns[index]);
          columns[index].reset();
          this.applyCss(columnAdapter, columnDescriptor.layout.css);
        });
      };

      this.moveBefore = function (selected, index) {
        if (index < 0 || index >= columns.length)
          return;
        columns.forEach((column) => {
          if (column.mapTo >= index)
            column.mapTo++;
        });
        columns.forEach((column) => {
          if (column.mapTo > selected.mapTo)
            column.mapTo--;
        });
        selected.mapTo = index;
      }

    }

    return {
      require: ['^^uiScrollViewport'],
      link: ($scope, element, $attr, controllers, linker) => {
        controllers[0].gridController = controllers[0].gridController || new GridController($scope, controllers[0]);
        controllers[0].gridController.registerColumn(element);
      }
    }
  }])

  .directive('uiScrollTd', ['$log', function (console) {
    return {
      require: ['?^^uiScrollViewport'],
      link: ($scope, element, $attr, controllers, linker) => {
        if (controllers[0]) {
          let gridController = controllers[0].gridController;
          let index = gridController.registerCell($scope, element);
          if (index >= 0) {
            element.attr('ui-scroll-td', index);
            $scope.$on('$destroy', () => gridController.unregisterCell(index, element));
          }
        }
      }
    }
  }]);