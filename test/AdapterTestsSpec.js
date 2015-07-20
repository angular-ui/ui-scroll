/*global describe, beforeEach, module, inject, it, expect */
describe('uiScroll', function () {
	'use strict';

	angular.module('ui.scroll.test', [])
		.factory('myEmptyDatasource', [
			'$log', '$timeout', '$rootScope', function () {
				return {
					get: function (index, count, success) {
						success([]);
					}
				};
			}
		])

		.factory('myOnePageDatasource', [
			'$log', '$timeout', '$rootScope', function () {
				return {
					get: function (index, count, success) {
						if (index === 1) {
							success(['one', 'two', 'three']);
						} else {
							success([]);
						}
					}
				};
			}
		])

		.factory('myObjectDatasource', [
			'$log', '$timeout', '$rootScope', function () {
				return {
					get: function (index, count, success) {
						if (index === 1) {
							success([{text: 'one'}, {text: 'two'}, {text: 'three'}]);
						} else {
							success([]);
						}
					}
				};
			}
		])

		.factory('myMultipageDatasource', [
			'$log', '$timeout', '$rootScope', function () {
				return {
					get: function (index, count, success) {
						var result = [];
						for (var i = index; i < index + count; i++) {
							if (i > 0 && i <= 20)
								result.push('item' + i);
						}
						success(result);
					}
				};
			}
		])

		.factory('anotherDatasource', [
			'$log', '$timeout', '$rootScope', function () {
				return {
					get: function (index, count, success) {
						var result = [];
						for (var i = index; i < index + count; i++) {
							if (i > -3 && i < 1)
								result.push('item' + i);
						}
						success(result);
					}
				};
			}
		])

		.factory('myEdgeDatasource', [
			'$log', '$timeout', '$rootScope', function () {
				return {
					get: function (index, count, success) {
						var result = [];
						for (var i = index; i < index + count; i++) {
							if (i > -6 && i <= 6)
								result.push('item' + i);
						}
						success(result);
					}
				};
			}
		])

		.factory('myDatasourceToPreventScrollBubbling', [
			'$log', '$timeout', '$rootScope', function () {
				return {
					get: function (index, count, success) {
						var result = [];
						for (var i = index; i < index + count; i++) {
							if (i < -6 || i > 20) {
								break;
							}
							result.push('item' + i);
						}
						success(result);
					}
				};
			}
		]);

	beforeEach(module('ui.scroll'));
	beforeEach(module('ui.scroll.test'));

	var createHtml = function (settings) {
		var viewportStyle = ' style="height:' + (settings.viewportHeight || 200) + 'px"';
		var itemStyle = settings.itemHeight ? ' style="height:' + settings.itemHeight + 'px"' : '';
		var bufferSize = settings.bufferSize ? ' buffer-size="' + settings.bufferSize + '"' : '';
		var isLoading = settings.isLoading ? ' is-loading="' + settings.isLoading + '"' : '';
		var adapter = settings.adapter ? ' adapter="' + settings.adapter + '"' : '';
		var template = settings.template ? settings.template : '{{$index}}: {{item}}';
		return '<div ui-scroll-viewport' + viewportStyle + '>' +
			'<div ui-scroll="item in ' + settings.datasource + '"' +
			adapter +
			itemStyle + bufferSize + isLoading + '>' +
			template +
			'</div>' +
			'</div>';
	};

	var runTest = function (scrollSettings, run, options) {
		inject(function ($rootScope, $compile, $window, $timeout) {
				var scroller = angular.element(createHtml(scrollSettings));
				var scope = $rootScope.$new();
				angular.element(document).find('body').append(scroller);

				$compile(scroller)(scope);

				scope.$apply();
				$timeout.flush();

				run(scroller, scope, $timeout);

				scroller.remove();

				if (options && typeof options.cleanupTest === 'function') {
					options.cleanupTest(scroller, scope, $timeout);
				}
			}
		);
	};

	describe('applyUpdates tests\n', function () {
		var scrollSettings = {datasource: 'myOnePageDatasource', adapter: 'adapter'};

		it('should create adapter object', function () {
			runTest(scrollSettings,
				function (viewport, scope) {
					expect(viewport.children().length).toBe(5);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should update rows in place', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item, scope) {
							return [item + ' *' + scope.$index];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(5);
					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one *1');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two *2');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three *3');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
				}
			);
		});

		it('should update selected (first) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item, scope) {
							if (item === 'one')
								return [item + ' *' + scope.$index];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(5);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one *1');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
				}
			);
		});

		it('should update selected (middle) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item, scope) {
							if (item === 'two')
								return [item + ' *' + scope.$index];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(5);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two *2');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should update selected (last) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item, scope) {
							if (item === 'three')
								return [item + ' *' + scope.$index];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(5);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three *3');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should delete selected (first) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item) {
							if (item === 'one')
								return [];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(4);

					var row2 = viewport.children()[1];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('1: two');

					var row3 = viewport.children()[2];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('2: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: two');
				}
			);
		});

		it('should delete selected (middle) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item) {
							if (item === 'two')
								return [];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(4);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should delete selected (last) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item) {
							if (item === 'three')
								return [];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(4);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should insert a new element before selected (first) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item) {
							if (item === 'one')
								return ['before one', item];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(6);

					var row0 = viewport.children()[1];
					expect(row0.tagName.toLowerCase()).toBe('div');
					expect(row0.innerHTML).toBe('1: before one');

					var row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: one');

					var row2 = viewport.children()[3];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('3: two');

					var row3 = viewport.children()[4];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('4: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: before one');
				}
			);
		});

		it('should insert a new element after selected (first) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item) {
							if (item === 'one')
								return [item, 'after one'];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(6);

					var row0 = viewport.children()[1];
					expect(row0.tagName.toLowerCase()).toBe('div');
					expect(row0.innerHTML).toBe('1: one');

					var row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: after one');

					var row2 = viewport.children()[3];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('3: two');

					var row3 = viewport.children()[4];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('4: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should insert a new element before selected (middle) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item) {
							if (item === 'two')
								return ['before two', item];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(6);

					var row0 = viewport.children()[1];
					expect(row0.tagName.toLowerCase()).toBe('div');
					expect(row0.innerHTML).toBe('1: one');

					var row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: before two');

					var row2 = viewport.children()[3];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('3: two');

					var row3 = viewport.children()[4];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('4: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should insert a new element after selected (last) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item) {
							if (item === 'three')
								return [item, 'after three'];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(6);

					var row0 = viewport.children()[1];
					expect(row0.tagName.toLowerCase()).toBe('div');
					expect(row0.innerHTML).toBe('1: one');

					var row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: two');

					var row2 = viewport.children()[3];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('3: three');

					var row3 = viewport.children()[4];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('4: after three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});
	});

	describe('applyUpdates tests (index based)\n', function () {
		var scrollSettings = {datasource: 'myOnePageDatasource', adapter: 'adapter'};

		it('should update selected (first) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(1, ['one *1']);

					$timeout.flush();

					expect(viewport.children().length).toBe(5);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one *1');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
				}
			);
		});

		it('should ignore out of bound indexes', function () {
			runTest(scrollSettings,
				function (viewport, scope) {

					scope.adapter.applyUpdates(0, ['invalid']);

					expect(viewport.children().length).toBe(5);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should ignore out of bound indexes 2', function () {
			runTest(scrollSettings,
				function (viewport, scope) {

					scope.adapter.applyUpdates(4, ['invalid']);

					expect(viewport.children().length).toBe(5);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should update selected (middle) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(2, ['two *2']);

					$timeout.flush();

					expect(viewport.children().length).toBe(5);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two *2');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should update selected (last) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(3, ['three *3']);

					$timeout.flush();

					expect(viewport.children().length).toBe(5);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three *3');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should delete selected (first) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(1, []);

					$timeout.flush();

					expect(viewport.children().length).toBe(4);

					var row2 = viewport.children()[1];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('1: two');

					var row3 = viewport.children()[2];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('2: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: two');
				}
			);
		});

		it('should delete selected (middle) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(2, []);

					$timeout.flush();

					expect(viewport.children().length).toBe(4);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should delete selected (last) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(3, []);

					$timeout.flush();

					expect(viewport.children().length).toBe(4);

					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should insert a new element before selected (first) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(1, ['before one', 'one']);

					$timeout.flush();

					expect(viewport.children().length).toBe(6);

					var row0 = viewport.children()[1];
					expect(row0.tagName.toLowerCase()).toBe('div');
					expect(row0.innerHTML).toBe('1: before one');

					var row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: one');

					var row2 = viewport.children()[3];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('3: two');

					var row3 = viewport.children()[4];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('4: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: before one');
				}
			);
		});

		it('should insert a new element after selected (first) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(1, ['one', 'after one']);

					$timeout.flush();

					expect(viewport.children().length).toBe(6);

					var row0 = viewport.children()[1];
					expect(row0.tagName.toLowerCase()).toBe('div');
					expect(row0.innerHTML).toBe('1: one');

					var row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: after one');

					var row2 = viewport.children()[3];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('3: two');

					var row3 = viewport.children()[4];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('4: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should insert a new element before selected (middle) row', function () {

			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(2, ['before two', 'two']);

					$timeout.flush();

					expect(viewport.children().length).toBe(6);

					var row0 = viewport.children()[1];
					expect(row0.tagName.toLowerCase()).toBe('div');
					expect(row0.innerHTML).toBe('1: one');

					var row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: before two');

					var row2 = viewport.children()[3];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('3: two');

					var row3 = viewport.children()[4];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('4: three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});

		it('should insert a new element after selected (last) row', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(3, ['three', 'after three']);

					$timeout.flush();

					expect(viewport.children().length).toBe(6);

					var row0 = viewport.children()[1];
					expect(row0.tagName.toLowerCase()).toBe('div');
					expect(row0.innerHTML).toBe('1: one');

					var row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: two');

					var row2 = viewport.children()[3];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('3: three');

					var row3 = viewport.children()[4];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('4: after three');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
				}
			);
		});
	});

	describe('applyUpdates tests with object items\n', function () {
		var scrollSettings = {
			datasource: 'myObjectDatasource',
			adapter: 'adapter',
			template: '{{$index}}: {{item.text}}'
		};

		it('should update existing item inplace', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item, scope) {
							item.text += ' *' + scope.$index;
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(5);
					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one *1');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two *2');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three *3');

					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
				}
			);
		});

		it('should replace existing item with an updated one', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item, scope) {
							return [
								{
									text: item.text + ' *' + scope.$index
								}
							];
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(5);
					var row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one *1');

					var row2 = viewport.children()[2];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('2: two *2');

					var row3 = viewport.children()[3];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('3: three *3');


					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
				}
			);
		});

		it('should preserve the order of inserted items', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item, scope) {
							if (scope.$index == 1) {
								item.text += ' *' + scope.$index;
								return [
									{text: item.text + ' before 1'},
									{text: item.text + ' before 2'},
									item,
									{text: item.text + ' after 1'},
									{text: item.text + ' after 2'}
								];
							}
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(9);
					var row1, row2, row3;

					row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one *1 before 1');

					row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: one *1 before 2');

					row1 = viewport.children()[3];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('3: one *1');

					row1 = viewport.children()[4];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('4: one *1 after 1');

					row1 = viewport.children()[5];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('5: one *1 after 2');

					row2 = viewport.children()[6];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('6: two');

					row3 = viewport.children()[7];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('7: three');


					expect(scope.adapter).toBeTruthy();
				}
			);
		});

		it('should preserve the order of inserted items 2', function () {
			runTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.applyUpdates(
						function (item, scope) {
							if (scope.$index == 2) {
								item.text += ' *' + scope.$index;
								return [
									{text: item.text + ' before 1'},
									{text: item.text + ' before 2'},
									item,
									{text: item.text + ' after 1'},
									{text: item.text + ' after 2'}
								];
							}
						}
					);

					$timeout.flush();

					expect(viewport.children().length).toBe(9);
					var row1, row2, row3;

					row1 = viewport.children()[1];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('1: one');

					row1 = viewport.children()[2];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('2: two *2 before 1');

					row1 = viewport.children()[3];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('3: two *2 before 2');

					row2 = viewport.children()[4];
					expect(row2.tagName.toLowerCase()).toBe('div');
					expect(row2.innerHTML).toBe('4: two *2');

					row1 = viewport.children()[5];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('5: two *2 after 1');

					row1 = viewport.children()[6];
					expect(row1.tagName.toLowerCase()).toBe('div');
					expect(row1.innerHTML).toBe('6: two *2 after 2');

					row3 = viewport.children()[7];
					expect(row3.tagName.toLowerCase()).toBe('div');
					expect(row3.innerHTML).toBe('7: three');

					expect(scope.adapter).toBeTruthy();
				}
			);
		});
	});

    describe('append tests\n', function () {
        var scrollSettings = {datasource: 'myOnePageDatasource', adapter: 'adapter'};

        it('should append two rows to the dataset', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {

                    scope.adapter.append(['appended one', 'appended two']);

                    $timeout.flush();

                    expect(viewport.children().length).toBe(7);

                    var row1 = viewport.children()[1];
                    expect(row1.tagName.toLowerCase()).toBe('div');
                    expect(row1.innerHTML).toBe('1: one');

                    var row2 = viewport.children()[2];
                    expect(row2.tagName.toLowerCase()).toBe('div');
                    expect(row2.innerHTML).toBe('2: two');

                    var row3 = viewport.children()[3];
                    expect(row3.tagName.toLowerCase()).toBe('div');
                    expect(row3.innerHTML).toBe('3: three');

                    var row4 = viewport.children()[4];
                    expect(row4.tagName.toLowerCase()).toBe('div');
                    expect(row4.innerHTML).toBe('4: appended one');

                    var row5 = viewport.children()[5];
                    expect(row5.tagName.toLowerCase()).toBe('div');
                    expect(row5.innerHTML).toBe('5: appended two');

                    expect(scope.adapter).toBeTruthy();
                    expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
                }
            );
        });

        var emptyScrollSettings = {datasource: 'myEmptyDatasource', adapter: 'adapter'};

        it('should append two rows to the empty dataset', function () {
            runTest(emptyScrollSettings,
                function (viewport, scope, $timeout) {

                    scope.adapter.append(['appended one', 'appended two']);

                    $timeout.flush();

                    expect(viewport.children().length).toBe(4);

                    var row4 = viewport.children()[1];
                    expect(row4.tagName.toLowerCase()).toBe('div');
                    expect(row4.innerHTML).toBe('1: appended one');

                    var row5 = viewport.children()[2];
                    expect(row5.tagName.toLowerCase()).toBe('div');
                    expect(row5.innerHTML).toBe('2: appended two');

                    expect(scope.adapter).toBeTruthy();
                    expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: appended one');
                }
            );
        });

    });

    describe('prepend tests\n', function () {
        var scrollSettings = {datasource: 'myOnePageDatasource', adapter: 'adapter'};

        it('should prepend two rows to the dataset', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {

                    scope.adapter.prepend(['prepended one', 'prepended two']);

                    $timeout.flush();

                    expect(viewport.children().length).toBe(7);

                    var row4 = viewport.children()[1];
                    expect(row4.tagName.toLowerCase()).toBe('div');
                    expect(row4.innerHTML).toBe('-1: prepended one');

                    var row5 = viewport.children()[2];
                    expect(row5.tagName.toLowerCase()).toBe('div');
                    expect(row5.innerHTML).toBe('0: prepended two');

                    var row1 = viewport.children()[3];
                    expect(row1.tagName.toLowerCase()).toBe('div');
                    expect(row1.innerHTML).toBe('1: one');

                    var row2 = viewport.children()[4];
                    expect(row2.tagName.toLowerCase()).toBe('div');
                    expect(row2.innerHTML).toBe('2: two');

                    var row3 = viewport.children()[5];
                    expect(row3.tagName.toLowerCase()).toBe('div');
                    expect(row3.innerHTML).toBe('3: three');

                    expect(scope.adapter).toBeTruthy();
                    expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('-1: prepended one');
                }
            );
        });

        var emptyScrollSettings = {datasource: 'myEmptyDatasource', adapter: 'adapter'};

        it('should prepend two rows to the empty dataset', function () {
            runTest(emptyScrollSettings,
                function (viewport, scope, $timeout) {

                    scope.adapter.prepend(['prepended one', 'prepended two']);

                    $timeout.flush();

                    expect(viewport.children().length).toBe(4);

                    var row4 = viewport.children()[1];
                    expect(row4.tagName.toLowerCase()).toBe('div');
                    expect(row4.innerHTML).toBe('-1: prepended one');

                    var row5 = viewport.children()[2];
                    expect(row5.tagName.toLowerCase()).toBe('div');
                    expect(row5.innerHTML).toBe('0: prepended two');

                    expect(scope.adapter).toBeTruthy();
                    expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('-1: prepended one');
                }
            );
        });

    });

});