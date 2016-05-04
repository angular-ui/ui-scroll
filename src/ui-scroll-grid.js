angular.module('ui.scroll.grid', [])
  .directive('uiScrollTh', ['$log', '$timeout', function (console, $timeout) {

    function GridAdapter(controller) {

      this.getLayout = function() {
        return controller.getLayout();
      }

      this.applyLayout = function(layout) {
        controller.applyLayout(layout);
      }

      Object.defineProperty(this, 'columns', {get: () => {
        return controller.getColumns();
      }})
    }

    function ColumnAdapter(column) {

      this.css = function(/* attr, value */) {
        var attr = arguments[0];
        var value = arguments[1];
        if (arguments.length == 1) {
          return column.header.css(attr);
        }
        if (arguments.length == 2) {
          column.header.css(attr,value);
          column.cells.forEach((cell) => {
            cell.css(attr,value);
          });
          column.layout.css[attr] = value;
        }
      }

    }

    function GridController(scope, scrollViewport) {
      var columns = [];
      var current;
      var index;

      $timeout(() => {
        scrollViewport.adapter.gridAdapter = new GridAdapter(this);
      });

      this.getColumns = function() {
        var result = [];
        columns.forEach((column) => result.push(new ColumnAdapter(column)));
        return result;
      }

      this.getLayout = function() {
        var result = [];
        columns.forEach((column, index) => {
          result.push({index: index, layout: {css: angular.extend({}, column.layout.css)}});
        });
        return result;
      }

      this.applyLayout = function(layouts) {
        layouts.forEach((column, index) => {
          if (index < 0 || index >= columns.length)
            return;
          for (var attr in column.layout.css)
            if (column.layout.css.hasOwnProperty(attr))
              new ColumnAdapter(columns[index]).css(attr, column.layout.css[attr]);
        });
      }

      this.registerColumn = function(header) {
        columns.push(
          {
            header:header, 
            cells:[],
            layout: {css: {}}
          });
      };

      this.registerCell = function(scope, cell) {
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

      this.unregisterCell = function(column, cell) {
        var index = columns[column].cells.indexOf(cell);
        columns[column].cells.splice(index,1);
      };

    }

    return {
      require: ['^^uiScrollViewport'],
      link: ($scope, element, $attr, controllers, linker) => {
        
        var gridController = controllers[0].gridController = controllers[0].gridController || new GridController($scope, controllers[0]);            
        gridController.registerColumn(element);
          
      }
    }
  }])
  .directive('uiScrollTd', ['$log', function (console) {
    return {
      require: ['?^^uiScrollViewport'],
      link: ($scope, element, $attr, controllers, linker) => {
        if (controllers[0]) {        
          var gridController = controllers[0].gridController;            
          var index = gridController.registerCell($scope, element);
          if (index >= 0) {
            element.attr('ui-scroll-td', index);
            $scope.$on('$destroy', () => {
              gridController.unregisterCell(index, element);
            });
          }
        }
      }
    }
  }]);