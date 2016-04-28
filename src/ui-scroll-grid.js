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
angular.module('ui.scroll.grid', [])
  .directive('uiScrollTh', ['$log', function (console) {

    function GridAdapter() {
      var headers = [];
      var current;
      var index;

      //controllers[0].adapter.gridAdapter = this;

      this.registerHeader = function(header) {
        headers.push(
          {
            header:header, 
            cells:[],
            observer: new MutationObserver((mutations) => {
              console.log(mutations);
            })
          });
      };

      this.registerCell = function(scope, cell) {
        if (current !== scope) {
          index = 0;
          current = scope;
        }
        if (index < headers.length) {
          headers[index].observer.observe(cell[0], {attributes: true, attributeOldValue: true});
          headers[index].cells.push(cell);
          headers[index].header.css('width', window.getComputedStyle(cell[0]).width);
          return index++;
        }
        return -1;
      };

      this.unregisterCell = function(column, cell) {
        var index = headers[column].cells.indexOf(cell);
        headers[column].cells.splice(index,1);
      };

    }

    return {
      require: ['^uiScrollViewport'],
      link: { pre: () => {}, post: ($scope, element, $attr, controllers, linker) => {
        
        gridAdapter = controllers[0].gridAdapter = controllers[0].gridAdapter || new GridAdapter();            
        gridAdapter.registerHeader(element);
          
      }}
    }
  }])
  .directive('uiScrollTd', ['$log', function (console) {
    return {
      require: ['?^^uiScrollViewport'],
      link: ($scope, element, $attr, controllers, linker) => {
        if (controllers[0]) {        
          gridAdapter = controllers[0].gridAdapter;            
          var index = gridAdapter.registerCell($scope, element);
          if (index >= 0) {
            element.attr('ui-scroll-td', index);
            $scope.$on('$destroy', () => {
              gridAdapter.unregisterCell(index, element);
            });
          }
        }
      }
    }
  }]);