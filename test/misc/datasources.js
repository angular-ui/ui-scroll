(function() {
  'use strict';

  angular.module('ui.scroll.test.datasources', [])

    .factory('myEmptyDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            success([]);
          }
        };
      }
    ])

    .factory('myDescriptoEmptyDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(descriptor, success) {
            success([]);
          }
        };
      }
    ])

    .factory('myOnePageDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            if (index === 1) {
              success(['one', 'two', 'three']);
            } else {
              success([]);
            }
          }
        };
      }
    ])

    .factory('myOneBigPageDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            if (index === 1) {
              var resultList = [];
              for (var i = 1; i < 100; i++) {
                resultList.push('item' + i);
              }
              success(resultList);
            } else {
              success([]);
            }
          }
        };
      }
    ])

    .factory('myDescriptorOnePageDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(descriptor, success) {
            if (descriptor.index === 1) {
              success(['one', 'two', 'three']);
            } else {
              success([]);
            }
          }
        };
      }
    ])

    .factory('myObjectDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            if (index === 1) {
              success([{ text: 'one' }, { text: 'two' }, { text: 'three' }]);
            } else {
              success([]);
            }
          }
        };
      }
    ])

    .factory('myMultipageDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            var result = [];
            for (var i = index; i < index + count; i++) {
              if (i > 0 && i <= 20) {
                result.push('item' + i);
              }
            }
            success(result);
          }
        };
      }
    ])

    .factory('anotherDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            var result = [];
            for (var i = index; i < index + count; i++) {
              if (i > -3 && i < 1) {
                result.push('item' + i);
              }
            }
            success(result);
          }
        };
      }
    ])

    .factory('myEdgeDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            var result = [];
            for (var i = index; i < index + count; i++) {
              if (i > -6 && i <= 6) {
                result.push('item' + i);
              }
            }
            success(result);
          }
        };
      }
    ])

    .factory('myDatasourceToPreventScrollBubbling', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            var result = [];
            for (var i = index; i < index + count; i++) {
              if (i < -6 || i > 20) {
                break;
              }
              result.push('item' + i);
            }
            success(result);
          }
        };
      }
    ])

    .factory('myInfiniteDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            var result = [];
            for (var i = index; i < index + count; i++) {
              result.push('item' + i);
            }
            success(result);
          }
        };
      }
    ])

    .factory('myGridDatasource', [
      '$log', '$timeout', '$rootScope',
      function() {
        return {
          get: function(index, count, success) {
            var result = [];
            for (var i = index; i < index + count; i++) {
              result.push({
                col0: 'col0',
                col1: 'col1',
                col2: 'col2',
                col3: 'col3'
              });
            }
            success(result);
          }
        };
      }
    ])


    .factory('myResponsiveDatasource', function() {
        var datasource = {
          data: [],
          min: 1,
          max: 30,
          init: function() {
            this.data = [];
            for (var i = this.min; i <= this.max; i++) {
              this.data.push('item' + i);
            }
          },
          getItem: function(index) {
            return this.data[index - this.min];
          },
          get: function(index, count, success) {
            var result = [];
            var start = Math.max(this.min, index);
            var end = Math.min(index + count - 1, this.max);
            if (start <= end) {
              for (var i = start; i <= end; i++) {
                result.push(this.getItem(i));
              }
            }
            success(result);
          }
        };
        datasource.init();
        return datasource;
      }
    );

})();