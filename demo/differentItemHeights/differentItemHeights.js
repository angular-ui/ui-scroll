angular.module('application', ['ui.scroll'])

.run(function($rootScope) {
  $rootScope.doReload = function () {
    $rootScope.$broadcast('DO_RELOAD');
  };
})

.controller('MainCtrl', function($scope) {
  $scope.hello = 'Hello Main Controller!';
  var counter = 0;

  var reloadListener = $scope.$on('DO_RELOAD', function() {
    if ($scope.adapter) {
      counter = 0;
      $scope.adapter.reload();
    }
  });

  $scope.$on("$destroy", function() {
    reloadListener();
  });

  var min = -1000, max = 1000, delay = 0;

  $scope.datasource = {
    get: function(index, count, success) {
      setTimeout(function() {
        var result = [];
        var start = Math.max(min, index);
        var end = Math.min(index + count - 1, max);
        if (start <= end) {
          for (var i = start; i <= end; i++) {
            height = 50 + (counter++ * 2);
            result.push({ index: i, height: height });
          }
        }
        console.log('Got ' + result.length + ' items [' + start + '..' + end + ']');
        success(result);
      }, delay);
    }
  };

});
