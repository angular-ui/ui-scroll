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
							col2: 'item #' + i
						});
					}
					success(result);
				}, 100);
			};

			$scope.datasource = datasource;

			var splitter = angular.element(document.getElementById('splitter'));
			var startX = 0;
			var right = 0;
			var startDrag = false;

			$scope.dragStart = function (evt) {
				if(startDrag) {
					return false;
				}
				splitter.addClass('active');
				startDrag = true;
				startX = right + evt.clientX;
			};

			$scope.dragOver = function (evt) {
				if(!startDrag) {
					return false;
				}

				right = startX - evt.clientX;
				$scope.adapter.gridAdapter.columns[1].css('width', (200 + right) + 'px');
				$scope.adapter.gridAdapter.columns[0].css('width', (80 - right) + 'px');
				splitter.css('right', '0');

				return false;
			};

			$scope.dragDrop = function (evt) {
				startDrag = false;
				splitter.removeClass('active');
			}


		}
	]);


