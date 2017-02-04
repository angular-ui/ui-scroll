angular.module('application', ['ui.scroll'])
	.controller('mainController', [
		'$scope', '$log', '$timeout', function ($scope, console, $timeout) {
			var datasource = {};

			datasource.get = function (index, count, success) {
				$timeout(function () {
					var result = [];
					for (var i = index; i <= index + count - 1; i++) {
						result.push("item #" + i);
					}
					success(result);
				}, 100);
			};

			$scope.datasource = datasource;

			$scope.doReload = function () {
				if (angular.isFunction($scope.adapter.reload)) {
					var reloadIndex = parseInt($scope.reloadIndex, 10);
					reloadIndex = isNaN(reloadIndex) ? 1 : reloadIndex;
					$scope.adapter.reload(reloadIndex);
				}
			};
/*
			$scope.delay = false;
			$timeout(function() {
				$scope.delay = true;
			}, 500);
*/
		}
	]);
