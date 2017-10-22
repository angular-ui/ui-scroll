var app = angular.module('application', ['ui.scroll']);

app.factory('Server', [
  '$timeout', '$q', function ($timeout, $q) {

    var ServerFactory = {

      firstIndex: 1,

      lastIndex: 40,

      delay: 100,

      data: [],

      absIndex: 1,

      generateId: function () {
        var d = '-';
        function S4() {
          return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return (S4() + S4() + d + S4() + d + S4() + d + S4() + d + S4() + S4() + S4());
      },

      generateItem: function (index) {
        return {
          index: index,
          id: this.generateId(),
          content: 'Item #' + this.absIndex++
        }
      },

      init: function () {
        for (var i = this.firstIndex; i <= this.lastIndex; i++) {
          this.data.push(this.generateItem(i));
        }
      },

      getItem: function (index) {
        for (var i = this.data.length - 1; i >= 0; i--) {
          if (this.data[i].index === index) {
            return this.data[i];
          }
        }
      },

      returnDeferredResult: function (result) {
        var deferred = $q.defer();
        $timeout(function () {
          deferred.resolve(result);
        }, this.delay);
        return deferred.promise;
      },

      request: function (index, count) {
        var start = index;
        var end = index + count - 1;
        var item, result = {
          items: []
        };
        if (start <= end) {
          for (var i = start; i <= end; i++) {
            if (item = this.getItem(i)) {
              result.items.push(item);
            }
          }
        }
        return this.returnDeferredResult(result);
      },

      prependItem: function (params) {
        var prependedDataIndex = this.firstIndex-- - 1;
        var newItem = this.generateItem(prependedDataIndex);
        newItem.content += params;
        this.data.unshift(newItem);
        return this.returnDeferredResult(newItem);
      },

      appendItem: function (params) {
        var appendedDataIndex = this.lastIndex++ + 1;
        var newItem = this.generateItem(appendedDataIndex);
        newItem.content += params;
        this.data.push(newItem);
        return this.returnDeferredResult(newItem);
      },

      removeItemById: function (itemId) {
        var length = this.data.length;
        for (var i = 0; i < length; i++) {
          if (this.data[i].id === itemId) {
            this.data.splice(i, 1);
            for (var j = i; j < length - 1; j++) {
              this.data[j].index--;
            }
            this.setIndicies();
            return this.returnDeferredResult(true);
          }
        }
        return this.returnDeferredResult(false);
      },

      setIndicies: function() {
        if(!this.data.length) {
          this.firstIndex = 1;
          this.lastIndex = 1;
          return;
        }
        this.firstIndex = this.data[0].index;
        this.lastIndex = this.data[0].index;
        for (var i = this.data.length - 1; i >= 0; i--) {
          if(this.data[i].index > this.lastIndex) {
            this.lastIndex = this.data[i].index;
          }
          if(this.data[i].index < this.firstIndex) {
            this.firstIndex = this.data[i].index;
          }
        }
      }
    };

    ServerFactory.init();

    return ServerFactory;

  }
]);


app.controller('mainController', [
  '$scope', 'Server', function ($scope, Server) {

    var ctrl = this;

    ctrl.datasource = {
      get: function (index, count, success) {
        console.log('request by index = ' + index + ', count = ' + count);
        Server.request(index, count).then(function (result) {
          if (result.items) {
            console.log('resolved ' + result.items.length + ' items');
          }
          success(result.items);
        });
      }
    };

    $scope.$watch('adapter', (prev, next) => {
      console.log('The adapter has been initialized');
    });

    ctrl.prepend = function () {
      Server.prependItem(' ***').then(function (newItem) {
        if (ctrl.adapter.isBOF()) {
          ctrl.adapter.prepend([newItem]);
        }
      });
    };

    ctrl.append = function () {
      Server.appendItem(' ***').then(function (newItem) {
        if (ctrl.adapter.isEOF()) {
          ctrl.adapter.append([newItem]);
        }
      });
    };

    ctrl.removeAll = function () {
      ctrl.adapter.applyUpdates(function (item) {
        if (item.id) {
          Server.removeItemById(item.id);
          return [];
        }
      });
    };

    ctrl.remove = function (itemRemove) {
      Server.removeItemById(itemRemove.id).then(function (result) {
        if (result) {
          ctrl.adapter.applyUpdates(function (item) {
            if (item.id === itemRemove.id) {
              return [];
            }
          });
        }
      });
    };

  }
]);
