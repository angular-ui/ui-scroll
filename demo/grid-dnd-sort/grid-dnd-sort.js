angular.module('application', ['ui.scroll', 'ui.scroll.jqlite', 'ui.scroll.grid', 'dnd'])
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

			var indexes = getIndexes();

			function getIndexes() {
				var indexes = [];
				for (var i = 0; i < $scope.headers.length - 1; i++) {
					indexes.push($scope.headers[i].index);
				}
				return indexes;
			}

			$scope.onSortEnd = function () {
				var target;
				for (var i = 0; i < $scope.headers.length; i++) {
					var index = $scope.headers[i].index;
					if (index !== indexes[i]) {
						if(target) {
							target.exchangeWith(index);
							break;
						}
						target = $scope.adapter.gridAdapter.columns[index];
					}
				}
				indexes = getIndexes();
			};

		}
	]);
