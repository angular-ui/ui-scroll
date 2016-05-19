/*global describe, beforeEach, module, it, expect, runGridTest */
describe('uiScroll', function () {
    'use strict';

    beforeEach(module('ui.scroll'));
    beforeEach(module('ui.scroll.grid'));
    beforeEach(module('ui.scroll.test.datasources'));

    describe('empty grid with 4 columns', function () {
        var scrollSettings = {datasource: 'myEmptyDatasource'};

        it('should create gridAdapter', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    expect(scope.adapter).toBeTruthy();
                    expect(scope.adapter.gridAdapter).toBeTruthy();
                }
            );
        });

        it('columns should have default mapping', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.getLayout()
                        .forEach((column, index) => {expect(column.mapTo).toBe(index);});
                }
            );
        });

        it('column mappings should not be affected by 0 -> 0 move', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[0].moveBefore(0);
                    scope.adapter.gridAdapter.getLayout()
                        .forEach((column, index) => {expect(column.mapTo).toBe(index);});
                }
            );
        });

        it('column mappings should not be affected by 1 -> 1 move', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[1].moveBefore(1);
                    scope.adapter.gridAdapter.getLayout()
                        .forEach((column, index) => {expect(column.mapTo).toBe(index);});
                }
            );
        });

        it('column mappings should not be affected by 3 -> 3 move', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[3].moveBefore(3);
                    scope.adapter.gridAdapter.getLayout()
                        .forEach((column, index) => {expect(column.mapTo).toBe(index);});
                }
            );
        });

        it('column mappings should reflect 1 -> 0 move', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[1].moveBefore(0);
                    var layout = scope.adapter.gridAdapter.getLayout();
                    expect(layout[0].mapTo).toBe(1);
                    expect(layout[1].mapTo).toBe(0);
                    expect(layout[2].mapTo).toBe(2);
                    expect(layout[3].mapTo).toBe(3);
                }
            );
        });

        it('column mappings should reflect 3 -> 0 move', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[3].moveBefore(0);
                    var layout = scope.adapter.gridAdapter.getLayout();
                    expect(layout[0].mapTo).toBe(1);
                    expect(layout[1].mapTo).toBe(2);
                    expect(layout[2].mapTo).toBe(3);
                    expect(layout[3].mapTo).toBe(0);
                }
            );
        });

        it('column mappings should reflect 2 -> 1 move', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[2].moveBefore(1);
                    var layout = scope.adapter.gridAdapter.getLayout();
                    expect(layout[0].mapTo).toBe(0);
                    expect(layout[1].mapTo).toBe(2);
                    expect(layout[2].mapTo).toBe(1);
                    expect(layout[3].mapTo).toBe(3);
                }
            );
        });

        it('column mappings should reflect 0 -> 1 move (it is a noop)', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[0].moveBefore(1);
                    var layout = scope.adapter.gridAdapter.getLayout();
                    expect(layout[0].mapTo).toBe(0);
                    expect(layout[1].mapTo).toBe(1);
                    expect(layout[2].mapTo).toBe(2);
                    expect(layout[3].mapTo).toBe(3);
                }
            );
        });

        it('column mappings should reflect 2 -> 2 move (it is a noop)', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[2].moveBefore(2);
                    var layout = scope.adapter.gridAdapter.getLayout();
                    expect(layout[0].mapTo).toBe(0);
                    expect(layout[1].mapTo).toBe(1);
                    expect(layout[2].mapTo).toBe(2);
                    expect(layout[3].mapTo).toBe(3);
                }
            );
        });

        it('column mappings should reflect 0 -> 2 move', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[0].moveBefore(2);
                    var layout = scope.adapter.gridAdapter.getLayout();
                    expect(layout[0].mapTo).toBe(1);
                    expect(layout[1].mapTo).toBe(0);
                    expect(layout[2].mapTo).toBe(2);
                    expect(layout[3].mapTo).toBe(3);
                }
            );
        });

        it('column mappings should reflect 0 -> 4 move', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[0].moveBefore(4);
                    var layout = scope.adapter.gridAdapter.getLayout();
                    expect(layout[0].mapTo).toBe(3);
                    expect(layout[1].mapTo).toBe(0);
                    expect(layout[2].mapTo).toBe(1);
                    expect(layout[3].mapTo).toBe(2);
                }
            );
        });

        it(' 1 -> 0 move twice should be a noop', function () {
            runGridTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    $timeout.flush();
                    scope.adapter.gridAdapter.columns[1].moveBefore(0);
                    var layout = scope.adapter.gridAdapter.getLayout();
                    expect(layout[0].mapTo).toBe(1);
                    expect(layout[1].mapTo).toBe(0);
                    expect(layout[2].mapTo).toBe(2);
                    expect(layout[3].mapTo).toBe(3);
                    scope.adapter.gridAdapter.columns[1].moveBefore(0);
                    scope.adapter.gridAdapter.getLayout()
                        .forEach((column, index) => {expect(column.mapTo).toBe(index);});
                }
            );
        });

    });

});