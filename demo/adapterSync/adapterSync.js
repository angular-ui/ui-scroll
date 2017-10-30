var app = angular.module('application', ['ui.scroll', 'server']);

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

    // todo dhilt : need to implement it properly
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
        if (result !== false) {
          ctrl.adapter.applyUpdates(function (item) {
            if (item.id === itemRemove.id) {
              return [];
            }
          });
        }
      });
    };

    ctrl.removeFirst = function () {
      Server.removeFirst().then(function (indexRemoved) {
        if (indexRemoved !== false) {
          ctrl.adapter.applyUpdates(indexRemoved, []);
        }
      });
    };

    ctrl.removeLast = function () {
      Server.removeLast().then(function (indexRemoved) {
        if (indexRemoved !== false) {
          ctrl.adapter.applyUpdates(indexRemoved, []);
        }
      });
    };

    ctrl.insertSome = function (indexToInsert) {
      indexToInsert = parseInt(indexToInsert, 10);
      var promises = [
        Server.insertAfterIndex(indexToInsert, ' *** (1)'),
        Server.insertAfterIndex(indexToInsert + 1, ' *** (2)'),
        Server.insertAfterIndex(indexToInsert + 2, ' *** (3)')
      ];
      Promise.all(promises).then(function (result) {
        if (result && result.length) {
          // need to protect from null
          var _result = [];
          for(var i = 0; i < result.length; i++) {
            if(result[i]) {
              _result.push(result[i]);
            }
          }
          if(_result.length) {
            var item = getItemByIndex(indexToInsert);
            if(item) {
              _result.unshift(item);
            }
            ctrl.adapter.applyUpdates(indexToInsert, _result); 
          }
        }
      });
    };

    function getItemByIndex(index) {
      var foundItem = null;
      // use Adapter.applyUpdates to get indexed item from Buffer
      ctrl.adapter.applyUpdates(function (item) {
        if (item.index === index) {
          foundItem = item;
        }
      });
      return foundItem;
    }    

    ctrl.datasource.minIndex = Server.firstIndex;
    ctrl.datasource.maxIndex = Server.lastIndex;
  }
]);
