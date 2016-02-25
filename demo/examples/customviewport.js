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
        return $timeout(function () {
          var i, j, ref, ref1, result;
          result = [];
          for (i = j = ref = index, ref1 = index + count - 1; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
            result.push("item #" + i);
          }
          return success(result);
        }, 100);
      };
      return {
        get: get
      };
    }
  ]);


/*
 //# sourceURL=src/customviewport.js
 */
