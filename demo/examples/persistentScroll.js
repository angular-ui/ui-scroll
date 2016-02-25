angular.module('application', [
    'ui.scroll',
    'ui.scroll.jqlite'
  ])
  .factory('datasource', [
    '$log',
    '$timeout',
    '$rootScope',
    '$location',
    function (console, $timeout, $rootScope, $location) {
      var get, offset;
      offset = parseInt($location.search().offset || '0');
      get = function (index, count, success) {
        return $timeout(function () {
          var actualIndex, end, i, j, ref, ref1, result, start;
          actualIndex = index + offset;
          result = [];
          start = Math.max(-40, actualIndex);
          end = Math.min(actualIndex + count - 1, 100);
          if (start > end) {
            return success(result);
          } else {
            for (i = j = ref = start, ref1 = end; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
              result.push("item " + i);
            }
            return success(result);
          }
        }, 100);
      };
      $rootScope.$watch((function () {
        return $rootScope.topVisible;
      }), function () {
        if ($rootScope.topVisible) {
          $location.search('offset', $rootScope.topVisible.$index + offset);
          return $location.replace();
        }
      });
      return {
        get: get
      };
    }
  ]);


/*
 //# sourceURL=src/persistentScroll.js
 */
