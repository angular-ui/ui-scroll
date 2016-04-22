angular.module('application', ['ui.scroll', 'ui.scroll.jqlite'])
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

			$scope.$watch('needToDisable', function (value) {
				if(value) {
					$scope.myAdapter.disable();
				}
				else {
					$scope.myAdapter.enable();
				}
			});

		}
	]);
