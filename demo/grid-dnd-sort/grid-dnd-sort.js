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

			$scope.dragStart = function (evt) {
				var column = $scope.adapter.gridAdapter.columnFromPoint(evt.clientX, evt.clientY);
				evt.dataTransfer.setData('application/x-data', 
					$scope.adapter.gridAdapter.columns.findIndex((c) => c.columnId === column.columnId)	
				);
			}

			$scope.dragOver = function (evt) {
				evt.preventDefault();
				return false;
			}

			$scope.dragDrop = function (evt) {
				var target = $scope.adapter.gridAdapter.columnFromPoint(evt.clientX, evt.clientY); 
				var column = $scope.adapter.gridAdapter.columns[evt.dataTransfer.getData('application/x-data')];
				column.moveBefore(target);
				console.log(evt.dataTransfer);
			}

		}
	]);
