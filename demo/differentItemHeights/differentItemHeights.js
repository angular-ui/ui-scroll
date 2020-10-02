angular.module('application', ['ui.scroll'])

.run(function($rootScope) {
  $rootScope.doReload = function () {
    $rootScope.$broadcast('DO_RELOAD');
  };
})

.controller('MainCtrl', function($scope) {
  $scope.hello = 'Hello Main Controller!';

  var reloadListener = $scope.$on('DO_RELOAD', function() {
    if ($scope.adapter) {
      $scope.adapter.reload();
    }
  });

  $scope.$on("$destroy", function() {
    reloadListener();
  });

  var min = -50, max = 100, delay = 0;

  $scope.datasource = {
    get: function(index, count, success) {
      console.log('Getting ' + count + ' items started from ' + index + '...');
      setTimeout(function() {
        var result = [];
        var start = Math.max(min, index);
        var end = Math.min(index + count - 1, max);
        if (start <= end) {
          for (var i = start; i <= end; i++) {
            height = 50 + (i + 1);
            result.push({ index: i, height: height });
          }
        }
        console.log('Got ' + result.length + ' items [' + start + '..' + end + ']');
        success(result);
      }, delay);
    }
  };

});
