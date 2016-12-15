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
			$scope.adapter = {};

			$scope.setUserMinIndex = function () {
				var userMinIndex = parseInt($scope.userMinIndex, 10);
				if(!isNaN(userMinIndex))
					$scope.datasource.minIndex = userMinIndex;
			};

			$scope.setUserMaxIndex = function () {
				var userMaxIndex = parseInt($scope.userMaxIndex, 10);
				if(!isNaN(userMaxIndex))
					$scope.datasource.maxIndex = userMaxIndex;
			};

			$scope.setUserIndexes = function () {
				$scope.setUserMinIndex();
				$scope.setUserMaxIndex();
			};

			$scope.delay = false;
			$timeout(function() {
				$scope.delay = true;
			}, 500);

		}
	]);