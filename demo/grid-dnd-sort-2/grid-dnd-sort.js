angular.module('application', ['ui.scroll', 'ui.scroll.grid', 'dnd'])
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

			$scope.headers = [{
				index: 0,
				name: 'col1',
				sortable: true
			}, {
				index: 1,
				name: 'col2',
				sortable: true
			}, {
				index: 2,
				name: 'col3',
				sortable: true
			}];

			$scope.onSortEnd = function () {
				var layout = $scope.adapter.gridAdapter.getLayout();
				for (var i = 0; i < $scope.headers.length; i++) {
					layout[$scope.headers[i].index].mapTo = i;
				}
				$scope.adapter.gridAdapter.applyLayout(layout)
			};

		}
	]);