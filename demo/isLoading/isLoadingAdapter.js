angular.module('application', ['ui.scroll'])
	.controller('mainController', [
		'$scope', '$log', '$timeout', function ($scope, console, $timeout) {

			$scope.adapter = {};

			$scope.datasource = {};

			$scope.datasource.get = function (index, count, success) {
				$timeout(function () {
					var result = [];
					for (var i = index; i <= index + count - 1; i++) {
						result.push("item #" + i);
					}
					success(result);
				}, 100);
			};

		}
	]);
