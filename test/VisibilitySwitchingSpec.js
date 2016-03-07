/*global describe, beforeEach, module, it, expect, runTest */
describe('uiScroll', function () {
    'use strict';

    beforeEach(module('ui.scroll'));
    beforeEach(module('ui.scroll.test.datasources'));

    var checkContent = function (viewport, count) {
        for (var i = 1; i < count - 1; i++) {
            var row = viewport.children()[i];
            expect(row.tagName.toLowerCase()).toBe('div');
            expect(row.innerHTML).toBe(i + ': item' + i);
        }
    };

    describe('viewport visibility changing', function () {
        var scrollSettings = { datasource: 'myMultipageDatasource', viewportHeight: 200, itemHeight: 40, bufferSize: 3, adapter: 'adapter' };
        var onePackItemsCount = 3 + 2;
        var twoPacksItemsCount = 3 * 3 + 2;

        it('should create 9 divs with data (+ 2 padding divs)', function () {
            runTest(scrollSettings,
                function (viewport) {
                    expect(viewport.children().length).toBe(twoPacksItemsCount);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(viewport.children().css('height')).toBe('0px');
                    expect(angular.element(viewport.children()[twoPacksItemsCount - 1]).css('height')).toBe('0px');
                    checkContent(viewport, twoPacksItemsCount);
                }
            );
        });

        it('should preserve elements after visibility switched off (display:none)', function () {
            runTest(scrollSettings,
                function (viewport) {
                    viewport.css('display','none');

                    expect(viewport.children().length).toBe(twoPacksItemsCount);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(viewport.children().css('height')).toBe('0px');
                    expect(angular.element(viewport.children()[twoPacksItemsCount - 1]).css('height')).toBe('0px');
                    checkContent(viewport, twoPacksItemsCount);
                }
            );
        });


        it('should only load one batch with visibility switched off (display:none)', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    viewport.css('display','none');
                    scope.adapter.reload();
                    $timeout.flush();

                    expect(viewport.children().length).toBe(onePackItemsCount);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(viewport.children().css('height')).toBe('0px');
                    expect(angular.element(viewport.children()[onePackItemsCount - 1]).css('height')).toBe('0px');
                    checkContent(viewport, onePackItemsCount);
                }
            );
        });

        it('should load full set after visibility switched back on', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    viewport.css('display','none');
                    scope.adapter.reload();
                    $timeout.flush();

                    viewport.css('display','block');
                    scope.$apply();
                    $timeout.flush();

                    expect(viewport.children().length).toBe(twoPacksItemsCount);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(viewport.children().css('height')).toBe('0px');
                    expect(angular.element(viewport.children()[twoPacksItemsCount - 1]).css('height')).toBe('0px');
                    checkContent(viewport, onePackItemsCount);
                }
            );
        });
    });

    describe('items visibility changing', function () {
        var scrollSettings = { datasource: 'myMultipageDatasource', viewportHeight: 200, itemHeight: '0', bufferSize: 3, adapter: 'adapter' };
        var onePackItemsCount = 3 + 2;
        var twoPacksItemsCount = 3 * 2 + 2;

        it('should only load one batch with items height = 0', function () {
            runTest(scrollSettings,
                function (viewport) {

                    expect(viewport.children().length).toBe(onePackItemsCount);
                    expect(viewport.scrollTop()).toBe(0);
                    checkContent(viewport, onePackItemsCount);
                }
            );
        });

        it('should load full set after height of some item switched to non-zero', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {

                    angular.element(viewport.children()[onePackItemsCount - 1]).css('height', 40);
                    expect(angular.element(viewport.children()[onePackItemsCount - 1]).css('height')).toBe('40px');
                    scope.$apply();
                    //$timeout.flush();

                    $timeout(function() {
                        expect(viewport.children().length).toBe(twoPacksItemsCount);
                        expect(viewport.scrollTop()).toBe(0);
                        checkContent(viewport, twoPacksItemsCount);
                    }, 0);
                }
            );
        });
    });


});