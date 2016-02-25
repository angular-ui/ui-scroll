angular.module('application', [
    'ui.scroll',
    'ui.scroll.jqlite'
  ])
  .controller('mainController', [
    '$scope',
    '$log',
    '$timeout',
    function ($scope, console, $timeout) {
      var datasource;
      datasource = {};
      datasource.get = function (descriptor, success) {
        return $timeout(function () {
          var count, i, index, j, ref, ref1, result;
          index = descriptor.index;
          count = descriptor.count;
          result = [];
          for (i = j = ref = index, ref1 = index + count - 1; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
            result.push("item #" + i);
          }
          return success(result);
        }, 100);
      };
      return $scope.datasource = datasource;
    }
  ]);


/*
 //# sourceURL=src/scopeDatasource.js
 */
