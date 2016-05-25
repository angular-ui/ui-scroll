angular.module('application', ['ui.scroll', 'ui.scroll.jqlite', 'ui.scroll.grid'])
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

			var defaultLayout = [
				{index: 0, mapTo: 0, css: {}},
				{index: 1, mapTo: 1, css: {}},
				{index: 2, mapTo: 2, css: {}}
			];

			var someLayout = [
				{index: 0, mapTo: 0, css: {backgroundColor: '#f99'}},
				{index: 1, mapTo: 1, css: {backgroundColor: '#9f9'}},
				{index: 2, mapTo: 2, css: {backgroundColor: '#99f'}}
			];

			$scope.layout = defaultLayout;

			$scope.applyLayout = function () {
				$scope.adapter.gridAdapter.applyLayout($scope.layout);
			};

			$scope.setSomeLayout = function () {
				$scope.layout = someLayout;
				$scope.applyLayout();
			};

			$scope.clearLayout = function () {
				$scope.layout = defaultLayout;
				$scope.applyLayout();
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
