angular.module('application', ['ui.scroll', 'ui.scroll.grid'])
	.controller('gridController', [
		'$scope', '$log', '$timeout', function ($scope, console, $timeout) {
			var datasource = {};

			datasource.get = function (index, count, success) {
				$timeout(function () {
					var result = [];
					for (var i = index; i <= index + count - 1; i++) {
						result.push({
							col1: i,
							col2: 'item #' + i,
							col3: (Math.random() < 0.5)
						});
					}
					success(result);
				}, 100);
			};

			$scope.datasource = datasource;

			var clearLayout = [
				{index: 0, mapTo: 0, css: {backgroundColor: ''}},
				{index: 1, mapTo: 1, css: {backgroundColor: ''}},
				{index: 2, mapTo: 2, css: {backgroundColor: ''}}
			];

			var someLayout = [
				{index: 0, mapTo: 2, css: {backgroundColor: '#ccc'}},
				{index: 1, mapTo: 1, css: {backgroundColor: '#ddd'}},
				{index: 2, mapTo: 0, css: {backgroundColor: '#eee'}}
			];

			$scope.applyLayout = function () {
				$scope.adapter.gridAdapter.applyLayout(someLayout);
			};

			$scope.clearLayout = function () {
				$scope.adapter.gridAdapter.applyLayout(clearLayout);
			};

		}
	]);
