angular.module('application', ['ui.scroll']).controller('mainController', [
  '$timeout', function($timeout) {

    var datasource = {};

    datasource.get = function(index, count, success) {
      return $timeout(function() {
        var i, item, j, ref, ref1, result;
        result = [];
        for (i = j = ref = index, ref1 = index + count - 1; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
          item = {};
          item.id = i;
          item.content = "item #" + i;
          result.push(item);
        }
        return success(result);
      }, 100);
    };

    this.datasource = datasource;

    this.updateList = function() {
      this.adapter.applyUpdates(function(item, scope) {
        item.content += ' *';
      });
    };

  }
]);
