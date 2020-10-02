var app = angular.module('application', ['ui.scroll', 'server']);

app.controller('mainController', [
  '$scope', 'Server',
  function($scope, Server) {

    $scope.datasource = {
      get: function(index, count, success) {
        console.log('request by index = ' + index + ', count = ' + count);
        Server.request(index, count).then(function(result) {
          if (result.items.length) {
            console.log('resolved ' + result.items.length + ' items');
          }
          success(result.items);
        });
      }
    };

    $scope.prepend = function() {
      var newItem = Server.prependItem(' (new)*');
      if ($scope.adapter.isBOF()) {
        $scope.adapter.prepend([newItem]);
      }
    };

    $scope.append = function() {
      var newItem = Server.appendItem(' (new)*');
      if ($scope.adapter.isEOF()) {
        $scope.adapter.append([newItem]);
      }
    };

  }
]);