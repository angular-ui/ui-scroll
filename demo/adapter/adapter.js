angular.module('application', ['ui.scroll'])

  .controller('mainController', [
    '$scope', '$timeout',
    function ($scope, $timeout) {

      $scope.title = 'Main Controller';

      var datasource = {};

      datasource.get = function (index, count, success) {
        $timeout(function () {
          var result = [];
          for (var i = index; i <= index + count - 1; i++) {
            result.push({
              id: i,
              content: "item #" + i
            });
          }
          success(result);
        }, 100);
      };

      $scope.datasource = datasource;
    }
  ])

  .controller('firstController', ['$scope', function ($scope) {
    $scope.title = 'First Controller';

    $scope.firstListAdapter = {
      remain: true
    };

    $scope.updateList1 = function () {
      return $scope.firstListAdapter.applyUpdates(function (item, scope) {
        return item.content += ' *';
      });
    };

    $scope.removeFromList1 = function () {
      return $scope.firstListAdapter.applyUpdates(function (item, scope) {
        if (scope.$index % 2 === 0) {
          return [];
        }
      });
    };

    var idList1 = 1000;
    $scope.addToList1 = function () {
      return $scope.firstListAdapter.applyUpdates(function (item, scope) {
        var newItem;
        newItem = void 0;
        if (scope.$index === 2) {
          newItem = {
            id: idList1,
            content: 'a new one #' + idList1
          };
          idList1++;
          return [item, newItem];
        }
      });
    };
  }])

  .controller('secondController', ['$scope', function ($scope) {
    $scope.title = 'Second Controller';

    $scope.updateList2 = function () {
      return $scope.second.list.adapter.applyUpdates(function (item, scope) {
        return item.content += ' *';
      });
    };

    $scope.removeFromList2 = function () {
      return $scope.second.list.adapter.applyUpdates(function (item, scope) {
        if (scope.$index % 2 !== 0) {
          return [];
        }
      });
    };

    var idList2 = 2000;
    $scope.addToList2 = function () {
      return $scope.second.list.adapter.applyUpdates(function (item, scope) {
        var newItem;
        newItem = void 0;
        if (scope.$index === 4) {
          newItem = {
            id: idList2,
            content: 'a new one #' + idList2
          };
          idList2++;
          return [item, newItem];
        }
      });
    };
  }]);
