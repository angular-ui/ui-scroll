angular.module('application', ['ui.scroll', 'ui.scroll.jqlite', 'ui.scroll.grid'])
	.controller('mainController', [
		'$scope', '$log', '$timeout', function ($scope, console, $timeout) {
			var datasource = {};

			datasource.get = function (index, count, success) {
				$timeout(function () {
					var result = [];
					for (var i = index; i <= index + count - 1; i++) {
						result.push({col1: "item #" + i, col2: "item #" + i});
					}
					success(result);
				}, 100);
			};

			$scope.datasource = datasource;

			$scope.expand=function() {
				$scope.adapter.gridAdapter.columnWidth(0, '200px')
			}
		}
	]);
