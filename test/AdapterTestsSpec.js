/*global describe, beforeEach, module, it, expect, runTest */
describe('uiScroll', function () {
	'use strict';

	beforeEach(module('ui.scroll'));
    beforeEach(module('ui.scroll.test.datasources'));

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

    it('should append two rows to the dataset', function () {
      runTest({datasource: 'myOnePageDatasource', adapter: 'adapter'},
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

    it('should append two rows to the empty dataset', function () {
      runTest({datasource: 'myEmptyDatasource', adapter: 'adapter'},
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

    it('should prepend two rows to the dataset', function () {
      runTest({datasource: 'myOnePageDatasource', adapter: 'adapter'},
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

    it('should prepend two rows to the empty dataset', function () {
      runTest({datasource: 'myEmptyDatasource', adapter: 'adapter'},
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

  describe('adapter reload tests', function () {
    var scrollSettings = {datasource: 'myInfiniteDatasource', adapter: 'adapter'};

    it('initial load should be positioned at item#1', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.topVisible).toBe('item1');
        }
      );
    });

    it('reload(100) should position it at item#100', function () {
      runTest(scrollSettings,
        function (viewport, scope, $timeout) {
          expect(scope.adapter.topVisible).toBe('item1');

          scope.adapter.reload(100);
          $timeout.flush();

          expect(scope.adapter.topVisible).toBe('item100');
        }
      );
    });

    it('reload() should position it at item#1', function () {
      runTest(scrollSettings,
        function (viewport, scope, $timeout) {
          expect(scope.adapter.topVisible).toBe('item1');

          scope.adapter.reload(100);
          $timeout.flush();

          expect(scope.adapter.topVisible).toBe('item100');

          scope.adapter.reload();
          $timeout.flush();

          expect(scope.adapter.topVisible).toBe('item100');
        }
      );
    });

    it('reload(0) should position it at item#0', function () {
      runTest(scrollSettings,
        function (viewport, scope, $timeout) {
          expect(scope.adapter.topVisible).toBe('item1');

          scope.adapter.reload(100);
          $timeout.flush();

          expect(scope.adapter.topVisible).toBe('item100');

          scope.adapter.reload(0);
          $timeout.flush();

          expect(scope.adapter.topVisible).toBe('item0');
        }
      );
    });

  });

  describe('adapter bof/eof/empty', function () {

    it('empty dataset', function () {
      runTest({datasource: 'myEmptyDatasource', adapter: 'adapter'},
        function (viewport, scope) {
          expect(scope.adapter.isEmpty()).toBe(true);
          expect(scope.adapter.isBOF()).toBe(true);
          expect(scope.adapter.isEOF()).toBe(true);
        }
      );
    });

    it('one short page dataset', function () {
      runTest({datasource: 'myOnePageDatasource', adapter: 'adapter'},
        function (viewport, scope) {
          expect(scope.adapter.isEmpty()).toBe(false);
          expect(scope.adapter.isBOF()).toBe(true);
          expect(scope.adapter.isEOF()).toBe(true);
        }
      );
    });

    it('one big page dataset', function () {
      runTest({datasource: 'myOneBigPageDatasource', adapter: 'adapter'},
        function (viewport, scope) {
          expect(scope.adapter.isEmpty()).toBe(false);
          expect(scope.adapter.isBOF()).toBe(true);
          expect(scope.adapter.isEOF()).toBe(false);
        }
      );
    });

    it('one big page dataset after scroll down', function () {
      runTest({datasource: 'myOneBigPageDatasource', adapter: 'adapter'},
        function (viewport, scope) {

          expect(scope.adapter.isEmpty()).toBe(false);
          expect(scope.adapter.isBOF()).toBe(true);
          expect(scope.adapter.isEOF()).toBe(false);

          viewport.scrollTop(10000);
          viewport.trigger('scroll');

          expect(scope.adapter.isEOF()).toBe(true);
        }
      );
    });

  });

});