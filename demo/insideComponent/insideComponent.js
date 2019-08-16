(function (angular) {

  class Ctrl {
    constructor($timeout, $scope) {
      this.timeout = $timeout;
      this.show = true;
      this.$scope = $scope;
    }

    get(index, count, success) {
      this.timeout(function () {
        var result = [];
        for (var i = index; i <= index + count - 1; i++) {
          result.push({
            id: i,
            name: "item #" + i
          });
        }
        success(result);
      }, 100);
    }

    update(id) {
      return this.scrollAdapter.applyUpdates(function (item) {
        if (item.id === id) {
          item.name += " *";
        }
      });
    }
  }

  angular
    .module('application', ['ui.scroll'])
    .component('myComponent', {
      controllerAs: 'ctrl',
      template:
      '<div ui-scroll-viewport class="viewport" ng-if="ctrl.show">' +
        '<div class="item" ui-scroll="item in ctrl" adapter="ctrl.scrollAdapter">' +
          '<div ng-click="ctrl.update(item.id)">{{item.name}}</div>' +
        '</div>' +
      '</div>',
      controller: Ctrl
    });

})(angular);
