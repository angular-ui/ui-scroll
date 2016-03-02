angular.module('application', [
    'ui.scroll',
    'ui.scroll.jqlite'
  ])
  .factory('datasource', [
    '$log',
    '$timeout',
    function (console, $timeout) {
      var get;
      get = function (index, count, success) {
        var end, i, j, ref, ref1, result, start;
        result = [];
        start = Math.max(1, index);
        end = Math.min(index + count - 1, 3);
        if (start > end) {
          return success(result);
        } else {
          for (i = j = ref = start, ref1 = end; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
            result.push("item " + i);
          }
          return success(result);
        }
      };
      return {
        get: get
      };
    }
  ])
  .controller('main', function ($scope) {
    return $scope.click = function () {
      return $scope.adapter.applyUpdates(2, [
        'item 2',
        'two'
      ]);
    };
  });


/*
 //# sourceURL=src/applyUpdate.js
 */
