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

			var cookieName = 'ui-scroll-grid-layout';

			var clearLayout = [
				{index: 0, mapTo: 0, css: {backgroundColor: ''}},
				{index: 1, mapTo: 1, css: {backgroundColor: ''}},
				{index: 2, mapTo: 2, css: {backgroundColor: ''}}
			];

			$scope.layout = [
				{index: 0, mapTo: 0, css: {backgroundColor: '#eee'}},
				{index: 1, mapTo: 1, css: {backgroundColor: '#ddd'}},
				{index: 2, mapTo: 2, css: {backgroundColor: '#ccc'}}
			];

			$scope.applyLayout = function () {
				$scope.adapter.gridAdapter.applyLayout($scope.layout);
			};

			$scope.clearLayout = function () {
				$scope.adapter.gridAdapter.applyLayout(clearLayout);
			};

			$scope.saveLayout = function () {
				var layout = $scope.adapter.gridAdapter.getLayout();

				var date = new Date();
				date.setTime(date.getTime() + 30 * 24 * 3600 * 1000); // 30 days
				document.cookie = cookieName + "=" + JSON.stringify(layout) + "; path=/;expires = " + date.toGMTString();
			};

			$scope.restoreLayout = function () {
				var value = "; " + document.cookie;
				var parts = value.split("; " + cookieName + "=");
				var result;
				if (parts.length != 2 || !(result = parts.pop().split(";").shift())) {
					alert('Nothing to apply');
					return;
				}
				$scope.layout = JSON.parse(result);
				$scope.applyLayout();
			};

		}
	]);
