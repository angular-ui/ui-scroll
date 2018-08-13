angular.module('application', ['ui.scroll'])
	.factory('datasource', ['$log', '$timeout',
		function (console, $timeout) {

			var get = function (index, count, success) {
				$timeout(function () {
					var result = [];
					for (var i = index; i <= index + count - 1; i++) {
						result.push("item #" + i);
					}
					success(result);
				}, 700);
			};

			return {
				get: get
			};
		}
	]);
