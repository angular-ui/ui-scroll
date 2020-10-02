angular.module('application', ['ui.scroll'])
	.controller('mainController', ['$scope', function($scope) {
		$scope.show = true;
	}])
	.directive('myDir', function() {
		return {
			restrict: 'E',
			controllerAs: 'ctrl',
			template:
			'<div ui-scroll-viewport class="viewport" ng-if="ctrl.show">' +
				'<div class="item" ui-scroll="item in ctrl" adapter="ctrl.scrollAdapter">' +
					'<div ng-click="ctrl.update(item.id)">{{item.name}}</div>' +
				'</div>' +
			'</div>',
			controller: function ($timeout) {
				var ctrl = this;
				ctrl.show = true;
				ctrl.get = function(index, count, success) {
					$timeout(function () {
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
				ctrl.update = function(id) {
					return ctrl.scrollAdapter.applyUpdates(function(item) {
						if (item.id === id) {
							item.name += " *";
						}
				  });
				}
			}
		}
	}
);
