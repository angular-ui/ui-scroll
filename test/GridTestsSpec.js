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
                    var layout = scope.adapter.gridAdapter.getLayout();
                    layout.forEach((column, index) => {expect(column.mapTo).toBe(index);});
                }
            );
        });

    });

});