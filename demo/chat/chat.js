var app = angular.module('application', ['ui.scroll']);

app.factory('Server', [
	'$timeout', '$q', function ($timeout, $q) {

		return {

			max: 99,

			first: 1,

			delay: 100,

			data: [],

			init: function () {
				for (var i = this.first; i <= this.max; i++) {
					this.data.push({
						number: i,
						title: 'Message #' + i,
						text: Math.random().toString(36).substring(7)
					});
				}
			},

			request: function (start, end) {
				var self = this;
				var deferred = $q.defer();

				$timeout(function () {
					var result = [];
					if (start <= end) {
						for (var i = start; i <= end; i++) {
							var serverDataIndex = (-1) * i + self.first;
							var item = self.data[serverDataIndex];
							if (item) {
								result.push(item);
							}
						}
					}
					deferred.resolve(result);
				}, self.delay);

				return deferred.promise;
			}
		};

	}
]);


app.controller('mainController', [
	'$scope', 'Server', function ($scope, Server) {
		var datasource = {};

		Server.init();

		datasource.get = function (index, count, success) {
			console.log('index = ' + index + '; count = ' + count);

			var start = index;
			var end = Math.min(index + count - 1, Server.first);

			Server.request(start, end).then(success);
		};

		$scope.datasource = datasource;

	}
]);
