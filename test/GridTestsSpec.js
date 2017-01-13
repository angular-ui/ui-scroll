/*global describe, beforeEach, module, it, expect, runGridTest */
describe('uiScroll', function () {
	'use strict';

	beforeEach(module('ui.scroll'));
	beforeEach(module('ui.scroll.grid'));
	beforeEach(module('ui.scroll.test.datasources'));

	var scrollSettings = {
		datasource: 'myGridDatasource',
		viewportHeight: 120,
		itemHeight: 20,
		bufferSize: 3
	};

	function expectLayoutMap(scope, map) {
		var layout = scope.adapter.gridAdapter.getLayout();
		layout.forEach((column, index) => expect(column.mapTo).toBe(map[index]));
	}

	function getHeaderElement(head, index) {
		var header = head.children();
		return header.children()[index];
	}

	function getLastRowElement(body, index) {
		var rows = body.children();
		var lastRow = angular.element(rows[rows.length - 2]);
		return lastRow.children()[index];
	}

	function applyOrderLayout(scope, map) {
		var layout = [];
		for(var i = 0; i < map.length; i++) {
			layout.push({index: i, mapTo: map[i], css: {}});
		}
		scope.adapter.gridAdapter.applyLayout(layout);
	}

	function expectHeaderContents(head, contents) {
		for(var i = 0; i < contents.length; i++) {
			expect(getHeaderElement(head, i).innerHTML).toBe(contents[i]);
		}
	}

	function expectLastRowContents(body, contents) {
		for(var i = 0; i < contents.length; i++) {
			expect(getLastRowElement(body, i).innerHTML).toBe(contents[i]);
		}
	}


	describe('basic setup', function () {
		var scrollSettings = {datasource: 'myEmptyDatasource'};

		it('should create gridAdapter', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					expect(scope.adapter).toBeTruthy();
					expect(scope.adapter.gridAdapter).toBeTruthy();
					expect(Object.prototype.toString.call(scope.adapter.gridAdapter.getLayout()), '[object Array]');
				}
			);
		});

		it('columns should have default mapping', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});
	});


	describe('moveBefore method logic', function () {
		var scrollSettings = {datasource: 'myEmptyDatasource'};

		it('column mappings should not be affected by 0 -> 0 move', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[0].moveBefore(0);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should not be affected by 1 -> 1 move', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[1].moveBefore(1);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should not be affected by 3 -> 3 move', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[3].moveBefore(3);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 1 -> 0 move', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[1].moveBefore(0);
					expectLayoutMap(scope, [1, 0, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 3 -> 0 move', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[3].moveBefore(0);
					expectLayoutMap(scope, [1, 2, 3, 0]);
				}
			);
		});

		it('column mappings should reflect 2 -> 1 move', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[2].moveBefore(1);
					expectLayoutMap(scope, [0, 2, 1, 3]);
				}
			);
		});

		it('column mappings should reflect 0 -> 1 move (it is a noop)', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[0].moveBefore(1);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 2 -> 2 move (it is a noop)', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[2].moveBefore(2);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 0 -> 2 move', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[0].moveBefore(2);
					expectLayoutMap(scope, [1, 0, 2, 3]);
				}
			);
		});

		it('column mappings should reflect 0 -> 4 move', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[0].moveBefore(4);
					expectLayoutMap(scope, [3, 0, 1, 2]);
				}
			);
		});

		it(' 1 -> 0 move twice should be a noop', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[1].moveBefore(0);
					expectLayoutMap(scope, [1, 0, 2, 3]);

					scope.adapter.gridAdapter.columns[1].moveBefore(0);
					expectLayoutMap(scope, [0, 1, 2, 3]);
				}
			);
		});

		it('multiple moveBefore should work', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
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
	});


	describe('moveBefore method', function () {
		it('should reorder headers', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[2].moveBefore(1);
					expectHeaderContents(head, ['col0', 'col2', 'col1', 'col3']);
				}
			);
		});

		it('should reorder body columns', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.columns[2].moveBefore(1);
					expectLastRowContents(body, ['col0', 'col2', 'col1', 'col3']);
				}
			);
		});

		it('should reorder body columns after new rows rendering', function () {
			runGridTest(scrollSettings,
				function (head, body, scope, $timeout) {
					scope.adapter.gridAdapter.columns[2].moveBefore(1);

					body.scrollTop(1000);
					body.trigger('scroll');
					$timeout.flush();

					expectLastRowContents(body, ['col0', 'col2', 'col1', 'col3']);
				}
			);
		});
	});


	describe('css method', function () {
		var attr = 'backgroundColor', value = 'yellow';

		it('should apply css right after the call', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {

					var headerElement = getHeaderElement(head, 0);
					var lastRowElement = getLastRowElement(body, 0);
					expect(headerElement.style[attr]).toBe('');
					expect(lastRowElement.style[attr]).toBe('');

					scope.adapter.gridAdapter.columns[0].css(attr, value);
					expect(headerElement.style[attr]).toBe(value);
					expect(lastRowElement.style[attr]).toBe(value);
				}
			);
		});

		it('should apply css to new elements', function () {
			runGridTest(scrollSettings,
				function (head, body, scope, $timeout) {

					scope.adapter.gridAdapter.columns[0].css(attr, value);

					body.scrollTop(1000);
					body.trigger('scroll');
					$timeout.flush();

					var headerElement = getHeaderElement(head, 0);
					var lastRowElement = getLastRowElement(body, 0);
					expect(headerElement.style[attr]).toBe(value);
					expect(lastRowElement.style[attr]).toBe(value);
				}
			);
		});
	});


	describe('get and apply layout', function () {
		var layout = [
			{index: 0, mapTo: 3, css: {zIndex: '1'}},
			{index: 1, mapTo: 2, css: {zIndex: '20'}},
			{index: 2, mapTo: 1, css: {zIndex: '300'}},
			{index: 3, mapTo: 0, css: {zIndex: '4000'}}
		];
		var layoutCss = [
			{index: 0, mapTo: 0, css: {zIndex: '1'}},
			{index: 1, mapTo: 1, css: {zIndex: '20'}},
			{index: 2, mapTo: 2, css: {zIndex: '300'}},
			{index: 3, mapTo: 3, css: {zIndex: '4000'}}
		];

		it('should get empty layout', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.getLayout().forEach((column, index) => {
						expect(column.css['zIndex']).toBeFalsy();
						expect(column.mapTo).toBe(index);
					});
				}
			);
		});

		it('should apply some layout and then get it', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.applyLayout(layout);

					scope.adapter.gridAdapter.getLayout().forEach((column, index) => {
						expect(column.css['zIndex']).toBe(layout[index].css['zIndex']);
						expect(column.mapTo).toBe(layout[index].mapTo);
					});
				}
			);
		});

		it('should apply css layout to header elements', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.applyLayout(layoutCss);
					layoutCss.forEach((column, index) => {
						expect(getHeaderElement(head, index).style['zIndex']).toBe(column.css['zIndex']);
					});
				}
			);
		});

		it('should apply css layout to existed body elements', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					scope.adapter.gridAdapter.applyLayout(layoutCss);
					layoutCss.forEach((column, index) => {
						expect(getLastRowElement(body, index).style['zIndex']).toBe(column.css['zIndex']);
					});
				}
			);
		});

		it('should apply css layout to new body elements', function () {
			runGridTest(scrollSettings,
				function (head, body, scope, $timeout) {
					scope.adapter.gridAdapter.applyLayout(layoutCss);

					body.scrollTop(1000);
					body.trigger('scroll');
					$timeout.flush();

					layoutCss.forEach((column, index) => {
						expect(getLastRowElement(body, index).style['zIndex']).toBe(column.css['zIndex']);
					});
				}
			);
		});

		it('should apply order layout to header elements', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					applyOrderLayout(scope, [3, 2, 1, 0]);
					expectHeaderContents(head, ['col3', 'col2', 'col1', 'col0']);
				}
			);
		});

		it('should apply order layout to existed body elements', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					applyOrderLayout(scope, [3, 2, 1, 0]);
					expectLastRowContents(body, ['col3', 'col2', 'col1', 'col0']);
				}
			);
		});

		it('should apply order layout to new body elements', function () {
			runGridTest(scrollSettings,
				function (head, body, scope, $timeout) {
					applyOrderLayout(scope, [3, 2, 1, 0]);

					body.scrollTop(1000);
					body.trigger('scroll');
					$timeout.flush();

					expectLastRowContents(body, ['col3', 'col2', 'col1', 'col0']);
				}
			);
		});

		it('should apply order layout to existed body elements multiple times', function () {
			runGridTest(scrollSettings,
				function (head, body, scope) {
					applyOrderLayout(scope, [1, 2, 3, 0]);
					expectLastRowContents(body, ['col3', 'col0', 'col1', 'col2']);

					applyOrderLayout(scope, [1, 3, 2, 0]);
					expectLastRowContents(body, ['col3', 'col0', 'col2', 'col1']);

					applyOrderLayout(scope, [0, 2, 3, 1]);
					expectLastRowContents(body, ['col0', 'col3', 'col1', 'col2']);
				}
			);
		});

	});

});