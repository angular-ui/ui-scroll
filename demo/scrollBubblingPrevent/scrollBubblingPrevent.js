angular.module('application', ['ui.scroll']).factory('datasource', [
  '$log', '$timeout', function(console, $timeout) {
    var get, max, min;
    min = -50;
    max = 50;

    get = function(index, count, success) {
      $timeout(function() {
        var result = [];
        var start = Math.max(min, index);
        var end = Math.min(index + count - 1, max);
        if (start <= end) {
          for (var i = start; i <= end; i++) {
            result.push("item #" + i);
          }
        }
         success(result);
      }, 50);
    };

    return {
      get: get
    };
  }
]);