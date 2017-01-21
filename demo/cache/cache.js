angular.module('application', ['ui.scroll']).controller('mainController', [
  '$scope', '$log', '$timeout', function($scope, console, $timeout) {

    var datasource = {};

    datasource.cache = {
      initialize: function() {
        this.isEnabled = true;
        this.items = {};
        this.getPure = datasource.get;
        return datasource.get = this.getCached;
      },

      getCached: function(index, count, successCallback) {
        var self;
        self = datasource.cache;
        if (self.isEnabled) {
          if (self.getItems(index, count, successCallback)) {
            return;
          }
          return self.getPure(index, count, function(result) {
            self.saveItems(index, count, result);
            return successCallback(result);
          });
        }
        return self.getPure(index, count, successCallback);
      },

      toggle: function() {
        this.isEnabled = !this.isEnabled;
        return this.items = {};
      },

      saveItems: function(index, count, resultItems) {
        var i, item, j, len, results;
        results = [];
        for (i = j = 0, len = resultItems.length; j < len; i = ++j) {
          item = resultItems[i];
          if (!this.items.hasOwnProperty(index + i)) {
            results.push(this.items[index + i] = item);
          } else {
            results.push(void 0);
          }
        }
        return results;
      },

      getItems: function(index, count, successCallback) {
        var i, isCached, j, ref, ref1, result;
        result = [];
        isCached = true;
        for (i = j = ref = index, ref1 = index + count - 1; j <= ref1; i = j += 1) {
          if (!this.items.hasOwnProperty(i)) {
            isCached = false;
            return;
          }
          result.push(this.items[i]);
        }
        successCallback(result);
        return true;
      }
    };

    datasource.get = function(index, count, success) {
      return $timeout(function() {
        var i, item, j, ref, ref1, result;
        result = [];
        for (i = j = ref = index, ref1 = index + count - 1; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
          item = {};
          item.content = "item #" + i;
          item.data = {
            some: false
          };
          result.push(item);
        }
        return success(result);
      }, 100);
    };

    $scope.datasource = datasource;

		datasource.cache.initialize();
  }
]);