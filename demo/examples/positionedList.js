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
      var current, data, get, i, j, k, l, len, len1, letter1, letter2, position, ref, ref1;
      $rootScope.key = "";
      position = 0;
      data = [];
      ref = 'abcdefghijk';
      for (j = 0, len = ref.length; j < len; j++) {
        letter1 = ref[j];
        ref1 = 'abcdefghijk';
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          letter2 = ref1[k];
          for (i = l = 0; l <= 9; i = ++l) {
            data.push("" + letter1 + letter2 + ": 0" + i);
          }
        }
      }
      get = function (index, count, success) {
        return $timeout(function () {
          var actualIndex, end, start;
          actualIndex = index + position;
          start = Math.max(0 - position, actualIndex);
          end = Math.min(actualIndex + count - 1, data.length);
          if (start > end) {
            return success([]);
          } else {
            return success(data.slice(start, end + 1));
          }
        }, 100);
      };
      current = 0;
      $rootScope.$watch((function () {
        return $rootScope.key;
      }), function () {
        var len2, m, record;
        position = 0;
        for (m = 0, len2 = data.length; m < len2; m++) {
          record = data[m];
          if ($rootScope.key > record) {
            position++;
          }
        }
        return current++;
      });

      return {
        get: get
      };
    }
  ]);


/*
 //# sourceURL=src/positionedList.js
 */
