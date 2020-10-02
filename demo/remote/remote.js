angular.module('application', ['ui.scroll'])

  .factory('Server', function($timeout, $q) {
    return {

      default: {
        first: 0,
        max: 99,
        delay: 100
      },

      data: [],

      init: function(settings = {}) {
        this.first = settings.hasOwnProperty('first') ? settings.first : this.default.first;
        this.max = settings.hasOwnProperty('max') ? settings.max : this.default.max;
        this.delay = settings.hasOwnProperty('delay') ? settings.delay : this.default.delay;
        for (var i = this.first; i <= this.max; i++) {
          this.data[i] = {
            index: i,
            content: 'Item #' + i
          };
        }
      },

      request: function(index, count) {
        var self = this;
        var deferred = $q.defer();

        var start = index;
        var end = index + count - 1;

        $timeout(function() {
          var item, result = [];
          if (start <= end) {
            for (var i = start; i <= end; i++) {
              if (item = self.data[i]) {
                result.push(item);
              }
            }
          }
          deferred.resolve(result);
        }, self.delay);

        return deferred.promise;
      }
    };
  })

  .controller('mainController', function($scope, Server) {

    $scope.firstIndex = 1;

    Server.init({
      first: $scope.firstIndex,
      max: 100,
      delay: 40
    });

    $scope.datasource = {
      get: function(index, count, success) {
        console.log('requested index = ' + index + ', count = ' + count);
        Server.request(index, count).then(function(result) {
          console.log('resolved ' + result.length + ' items');
          success(result);
        });
      }
    };
  });