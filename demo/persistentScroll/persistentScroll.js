angular.module('application', ['ui.scroll'])
	.factory('datasource', [ '$log', '$timeout', '$rootScope', '$location',
		function (console, $timeout, $rootScope, $location) {

			var offset = parseInt($location.search().offset || '0', 10);

			var get = function (index, count, success) {
				$timeout(function () {
					var actualIndex = index + offset;
					var result = [];
					var start = Math.max(-40, actualIndex);
					var end = Math.min(actualIndex + count - 1, 100);
					if (start <= end) {
						for (var i = start; i <= end; i++) {
							result.push("item " + i);
						}
					}
					success(result);
				}, 100);
			};

			$rootScope.$watch((function () {
				return $rootScope.topVisible;
			}), function () {
				if ($rootScope.topVisible) {
					$location.search('offset', $rootScope.topVisible.$index + offset-1);
					$location.replace();
				}
			});

			return {
				get: get
			};
		}
	]);