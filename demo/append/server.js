angular.module('server', []).factory('Server', 
  ['$timeout', '$q', function($timeout, $q) {

    var ServerFactory = {

      max: 50,

      first: 1,

      delay: 100,

      data: [],

      prependedData: [],

      appendedData: [],

      generateItem: function(number) {
        return {
          number: number,
          content: 'Item #' + number
        }
      },

      init: function() {
        for (var i = this.first - 1; i <= this.max; i++) {
          this.data.push(this.generateItem(i));
        }
      },

      getItem: function(index) {
        if (index < this.first) {
          return this.prependedData[(-1) * index];
        } else if (index > this.max) {
          return this.appendedData[index - this.max - 1];
        } else {
          return this.data[index];
        }
      },

      request: function(index, count) {
        var self = this;
        var deferred = $q.defer();

        var start = index;
        var end = index + count - 1;

        $timeout(function() {
          var item, result = {
            items: []
          };
          if (start <= end) {
            for (var i = start; i <= end; i++) {
              if (item = self.getItem(i)) {
                result.items.push(item);
              }
            }
          }
          deferred.resolve(result);
        }, self.delay);

        return deferred.promise;
      },

      prependItem: function(params) {
        var prependedDataIndex = this.first - this.prependedData.length - 1;
        var newItem = this.generateItem(prependedDataIndex);
        newItem.content += params;
        this.prependedData.push(newItem);
        return newItem;
      },

      appendItem: function(params) {
        var appendedDataIndex = this.max + this.appendedData.length + 1;
        var newItem = this.generateItem(appendedDataIndex);
        newItem.content += params;
        this.appendedData.push(newItem);
        return newItem;
      }
    };

    ServerFactory.init();

    return ServerFactory;
  }
]);
