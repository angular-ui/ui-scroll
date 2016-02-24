angular.module('application', [
    'ui.scroll',
    'ui.scroll.jqlite'
  ])
  .controller('mainController', [
    '$scope',
    '$timeout',
    '$log',
    function ($scope, $timeout, console) {
      $scope.datasource = {
        get: function (index, count, success) {
          var i, j, ref, ref1, result;
          result = [];
          for (i = j = ref = index, ref1 = index + count - 1; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
            result.push("item #" + i);
          }
          return success(result);
        }
      };
      $scope.updateMinIndex = function () {
        return $scope.datasource.minIndex = -20;
      };
      $scope.scroll = function () {
        return console.log(angular.element(document.getElementById('div')).triggerHandler('scroll'));
      };
      return document.getElementById('scroll').onclick = function () {
        document.getElementById('div').scrollTop += 10;
        return $scope.adapter.test();
      };
    }
  ]);


/*
 //# sourceURL=src/customviewport.js
 */
