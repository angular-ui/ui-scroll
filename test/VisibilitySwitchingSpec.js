/*global describe, beforeEach, module, inject, it, spyOn, expect, $ */
describe('uiScroll', function () {
    'use strict';

    beforeEach(module('ui.scroll'));
    beforeEach(module('ui.scroll.test.datasources'));

    describe('datasource with 20 elements and buffer size 3 - constrained viewport', function () {
        var scrollSettings = { datasource: 'myMultipageDatasource', itemHeight: 40, bufferSize: 3, adapter: 'adapter' };

        it('should create 6 divs with data (+ 2 padding divs)', function () {
            runTest(scrollSettings,
                function (viewport) {
                    expect(viewport.children().length).toBe(8);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(viewport.children().css('height')).toBe('0px');
                    expect(angular.element(viewport.children()[7]).css('height')).toBe('0px');

                    for (var i = 1; i < 7; i++) {
                        var row = viewport.children()[i];
                        expect(row.tagName.toLowerCase()).toBe('div');
                        expect(row.innerHTML).toBe(i + ': item' + i);
                    }

                }
            );
        });

        it('should preserve elements after visibility switched off (display:none)', function () {
            runTest(scrollSettings,
                function (viewport) {
                    viewport.css('display','none');

                    expect(viewport.children().length).toBe(8);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(viewport.children().css('height')).toBe('0px');
                    expect(angular.element(viewport.children()[7]).css('height')).toBe('0px');

                    for (var i = 1; i < 7; i++) {
                        var row = viewport.children()[i];
                        expect(row.tagName.toLowerCase()).toBe('div');
                        expect(row.innerHTML).toBe(i + ': item' + i);
                    }

                }
            );
        });


        it('should only load one batch with visibility switched off (visibility:hidden)', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    viewport.css('display','none');
                    scope.adapter.reload();
                    $timeout.flush();

                    expect(viewport.children().length).toBe(5);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(viewport.children().css('height')).toBe('0px');
                    expect(angular.element(viewport.children()[4]).css('height')).toBe('0px');

                    for (var i = 1; i < 3; i++) {
                        var row = viewport.children()[i];
                        expect(row.tagName.toLowerCase()).toBe('div');
                        expect(row.innerHTML).toBe(i + ': item' + i);
                    }

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

                    expect(viewport.children().length).toBe(8);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(viewport.children().css('height')).toBe('0px');
                    expect(angular.element(viewport.children()[7]).css('height')).toBe('0px');

                    for (var i = 1; i < 7; i++) {
                        var row = viewport.children()[i];
                        expect(row.tagName.toLowerCase()).toBe('div');
                        expect(row.innerHTML).toBe(i + ': item' + i);
                    }

                }
            );
        });
    });


});