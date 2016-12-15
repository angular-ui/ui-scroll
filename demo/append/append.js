var app = angular.module('application', ['ui.scroll']);

app.factory('Server', [
	'$timeout', '$q', function ($timeout, $q) {

		var ServerFactory = {

			max: 50,

			first: 1,

			delay: 100,

			data: [],

			prependedData: [],

			appendedData: [],

			generateItem: function (number) {
				return {
					number: number,
					content: 'Item #' + number
				}
			},

			init: function () {
				for (var i = this.first - 1; i <= this.max; i++) {
					this.data.push(this.generateItem(i));
				}
			},

			getItem: function (index) {
				if (index < this.first) {
					return this.prependedData[(-1) * index];
				}
				else if (index > this.max) {
					return this.appendedData[index - this.max - 1];
				}
				else {
					return this.data[index];
				}
			},

			request: function (index, count) {
				var self = this;
				var deferred = $q.defer();

				var start = index;
				var end = index + count - 1;

				$timeout(function () {
					var item, result = {
						items: []
					};
					if (start <= end) {
						for (var i = start; i <= end; i++) {
							if (item = self.getItem(i)) {
								result.items.push(item);
							}
						}
					}
					deferred.resolve(result);
				}, self.delay);

				return deferred.promise;
			},

			prependItem: function (params) {
				var prependedDataIndex = this.first - this.prependedData.length - 1;
				var newItem = this.generateItem(prependedDataIndex);
				newItem.content += params;
				this.prependedData.push(newItem);
				return newItem;
			},

			appendItem: function (params) {
				var appendedDataIndex = this.max + this.appendedData.length + 1;
				var newItem = this.generateItem(appendedDataIndex);
				newItem.content += params;
				this.appendedData.push(newItem);
				return newItem;
			}
		};

		ServerFactory.init();

		return ServerFactory;

	}
]);


app.controller('mainController', [
	'$scope', 'Server', function ($scope, Server) {

		$scope.datasource = {
			get: function (index, count, success) {
				console.log('request by index = ' + index + ', count = ' + count);
				Server.request(index, count).then(function (result) {
					if (result.items.length) {
						console.log('resolved ' + result.items.length + ' items');
					}
					success(result.items);
				});
			}
		};

		$scope.prepend = function () {
			var newItem = Server.prependItem(' (new)*');
			if ($scope.adapter.isBOF()) {
				$scope.adapter.prepend([newItem]);
			}
		};

		$scope.append = function () {
			var newItem = Server.appendItem(' (new)*');
			if ($scope.adapter.isEOF()) {
				$scope.adapter.append([newItem]);
			}
		};

	}
]);
