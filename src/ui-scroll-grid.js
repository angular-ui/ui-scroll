angular.module('ui.scroll.grid', [])
  .directive('uiScrollTh', ['$log', '$timeout', function (console, $timeout) {

    function GridAdapter(controller) {
      this.columnWidth = function(column, width) {
        controller.columnWidth(column, width);
      }

      this.getLayout = function() {
        return controller.getLayout();
      }

      this.applyLayout = function(layout) {
        controller.applyLayout(layout);
      }
    }

    function GridController(scope, scrollViewport) {
      var columns = [];
      var current;
      var index;

      $timeout(() => {
        scrollViewport.adapter.gridAdapter = new GridAdapter(this);
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

      this.columnWidth = function(column, width) {
        if (column >= 0 && column < columns.length) {
          columns[column].header.css('width', width);
          columns[column].cells.forEach((cell) => {
            cell.css('width', width);
          });  
        }
      }

      this.getLayout = function() {
        var result = [];
        columns.forEach((column, index) => {
          result.push({index: index, width: window.getComputedStyle(column.header[0]).width});
        });
        return result;
      }

      this.applyLayout = function(layout) {
        layout.forEach((column, index) => {
          if (index < 0 || index >= columns.length)
            return;
          if (column.width)
            this.columnWidth(index, column.width);
        });
      }

      this.registerColumn = function(header) {
        columns.push(
          {
            header:header, 
            cells:[]
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