/*global describe, beforeEach, module, it, expect, runGridTest */
describe('uiScroll', function () {
	'use strict';

	beforeEach(module('ui.scroll'));
	beforeEach(module('ui.scroll.grid'));
	beforeEach(module('ui.scroll.test.datasources'));


	function expectLayoutMap(scope, map) {
		var layout = scope.adapter.gridAdapter.getLayout();
		layout.forEach((column, index) => expect(column.mapTo).toBe(map[index]));
	}

	function getElementOfLastRow(viewport, index) {
		var rows = viewport.children();
		var lastRow = angular.element(rows[rows.length - 2]);
		return lastRow.children()[index];
	}


	describe('empty grid with 4 columns', function () {
		var scrollSettings = {datasource: 'myEmptyDatasource'};

		it('should create gridAdapter', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.gridAdapter).toBeTruthy();
					expect(Object.prototype.toString.call(scope.adapter.gridAdapter.getLayout()), '[object Array]');
				}
			);
		});

		it('columns should have default mapping', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should not be affected by 0 -> 0 move', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[0].moveBefore(0);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should not be affected by 1 -> 1 move', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[1].moveBefore(1);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should not be affected by 3 -> 3 move', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[3].moveBefore(3);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 1 -> 0 move', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[1].moveBefore(0);
					expectLayoutMap(scope, [1, 0, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 3 -> 0 move', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[3].moveBefore(0);
					expectLayoutMap(scope, [1, 2, 3, 0]);
				}
			);
		});

		it('column mappings should reflect 2 -> 1 move', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[2].moveBefore(1);
					expectLayoutMap(scope, [0, 2, 1, 3]);
				}
			);
		});

		it('column mappings should reflect 0 -> 1 move (it is a noop)', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[0].moveBefore(1);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 2 -> 2 move (it is a noop)', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[2].moveBefore(2);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 0 -> 2 move', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[0].moveBefore(2);
					expectLayoutMap(scope, [1, 0, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 0 -> 4 move', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[0].moveBefore(4);
					expectLayoutMap(scope, [3, 0, 1, 2]);
				}
			);
		});

		it(' 1 -> 0 move twice should be a noop', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					scope.adapter.gridAdapter.columns[1].moveBefore(0);
					expectLayoutMap(scope, [1, 0, 2, 3]);

					scope.adapter.gridAdapter.columns[1].moveBefore(0);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('multiple moveBefore should work', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					expectLayoutMap(scope, [0, 1, 2, 3]);

					scope.adapter.gridAdapter.columns[2].moveBefore(1);
					expectLayoutMap(scope, [0, 2, 1, 3]);

					scope.adapter.gridAdapter.columns[3].moveBefore(0);
					expectLayoutMap(scope, [1, 3, 2, 0]);

					scope.adapter.gridAdapter.columns[3].moveBefore(2);
					expectLayoutMap(scope, [1, 2, 3, 0]);

					scope.adapter.gridAdapter.columns[1].moveBefore(3);
					expectLayoutMap(scope, [2, 1, 3, 0]);
				}
			);
		});

		it('multiple exchangeWith should work', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {
					expectLayoutMap(scope, [0, 1, 2, 3]);

					scope.adapter.gridAdapter.columns[2].exchangeWith(1);
					expectLayoutMap(scope, [0, 2, 1, 3]);

					scope.adapter.gridAdapter.columns[3].exchangeWith(0);
					expectLayoutMap(scope, [3, 2, 1, 0]);

					scope.adapter.gridAdapter.columns[3].exchangeWith(2);
					expectLayoutMap(scope, [2, 3, 1, 0]);

					scope.adapter.gridAdapter.columns[1].exchangeWith(3);
					expectLayoutMap(scope, [2, 1, 3, 0]);
				}
			);
		});

	});


	describe('css method', function () {
		var scrollSettings = {
			datasource: 'myGridDatasource',
			viewportHeight: 120,
			itemHeight: 20,
			bufferSize: 3
		};

		var attr = 'backgroundColor', value = 'yellow';

		it('should apply css right after the call', function () {
			runGridTest(scrollSettings,
				function (viewport, scope) {

					var element = getElementOfLastRow(viewport, 0);
					expect(element.style[attr]).toBe('');

					scope.adapter.gridAdapter.columns[0].css(attr, value);
					expect(element.style[attr]).toBe(value);
				}
			);
		});

		it('should apply css to new elements', function () {
			runGridTest(scrollSettings,
				function (viewport, scope, $timeout) {

					scope.adapter.gridAdapter.columns[0].css(attr, value);

					viewport.scrollTop(1000); // scroll to bottom
					viewport.trigger('scroll');
					$timeout.flush();

					var element = getElementOfLastRow(viewport, 0);
					expect(element.style[attr]).toBe(value);
				}
			);
		});
	});

});