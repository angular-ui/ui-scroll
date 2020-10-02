angular.module('application', ['ui.scroll'])
	.factory('datasource', ['$log', '$timeout', '$rootScope',
		function (console, $timeout, $rootScope) {

			$rootScope.key = "";
			var position = 0;
			var data = [];
			var ref1 = 'abcdefghijklmnopqrstuvwxyz';
			var ref2 = 'abcdefghijklmnopqrstuvwxyz';

			for (var j = 0; j < ref1.length; j++)
				for (var k = 0, letter1 = ref1[j]; k < ref2.length; k++)
					for (var i = 0, letter2 = ref2[k]; i <= 9; i++)
						data.push("" + letter1 + letter2 + ": 0" + i);

			var get = function (index, count, success) {
				return $timeout(function () {
					var actualIndex = index + position;
					var start = Math.max(0 - position, actualIndex);
					var end = Math.min(actualIndex + count - 1, data.length);

					if (start > end) {
						success([]);
					} else {
						success(data.slice(start, end + 1));
					}
				}, 100);
			};

			$rootScope.$watch((function () {
				return $rootScope.key;
			}), function () {
				position = 0;
				for (var m = 0; m < data.length; m++) {
					if ($rootScope.key > data[m]) {
						position++;
					}
				}
				if ($rootScope.key)
					$rootScope.adapter.reload();
			});

			return {
				get: get,
			};
		}
	]);
