/*global describe, beforeEach, module, inject, it, spyOn, expect, $ */
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
        ])

            .factory('myInfiniteDatasource', [
                '$log', '$timeout', '$rootScope', function () {
                    return {
                        get: function (index, count, success) {
                            var result = [];
                            for (var i = index; i < index + count; i++) {
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


    describe('basic setup', function () {
            var scrollSettings = {datasource: 'myEmptyDatasource'};

            it('should bind to window scroll and resize events and unbind them after the scope is destroyed', function () {
                spyOn($.fn, 'bind').and.callThrough();
                spyOn($.fn, 'unbind').and.callThrough();
                runTest(scrollSettings,
                    function (viewport) {
                        expect($.fn.bind.calls.all().length).toBe(3);
                        expect($.fn.bind.calls.all()[0].args[0]).toBe('resize');
                        expect($.fn.bind.calls.all()[0].object[0]).toBe(viewport[0]);
                        expect($.fn.bind.calls.all()[1].args[0]).toBe('scroll');
                        expect($.fn.bind.calls.all()[1].object[0]).toBe(viewport[0]);
                        expect($.fn.bind.calls.all()[2].args[0]).toBe('mousewheel');
                        expect($.fn.bind.calls.all()[2].object[0]).toBe(viewport[0]);
                    }, {
                        cleanupTest: function (viewport, scope, $timeout) {
                            $timeout(function () {
                                expect($.fn.unbind.calls.all().length).toBe(3);
                                expect($.fn.unbind.calls.all()[0].args[0]).toBe('resize');
                                expect($.fn.unbind.calls.all()[0].object[0]).toBe(viewport[0]);
                                expect($.fn.unbind.calls.all()[1].args[0]).toBe('scroll');
                                expect($.fn.unbind.calls.all()[1].object[0]).toBe(viewport[0]);
                                expect($.fn.unbind.calls.all()[2].args[0]).toBe('mousewheel');
                                expect($.fn.unbind.calls.all()[2].object[0]).toBe(viewport[0]);
                            });
                        }
                    }
                );
            });

            it('should create 2 divs of 0 height', function () {
                runTest(scrollSettings,
                    function (viewport) {
                        expect(viewport.children().length).toBe(2);

                        var topPadding = viewport.children()[0];
                        expect(topPadding.tagName.toLowerCase()).toBe('div');
                        expect(angular.element(topPadding).css('height')).toBe('0px');

                        var bottomPadding = viewport.children()[1];
                        expect(bottomPadding.tagName.toLowerCase()).toBe('div');
                        expect(angular.element(bottomPadding).css('height')).toBe('0px');
                    }
                );
            });

            it('should call get on the datasource 1 time ', function () {
                var spy;
                inject(function (myEmptyDatasource) {
                    spy = spyOn(myEmptyDatasource, 'get').and.callThrough();
                });
                runTest(scrollSettings,
                    function () {
                        expect(spy.calls.all().length).toBe(2);
                        expect(spy.calls.all()[0].args[0]).toBe(1);
                        expect(spy.calls.all()[1].args[0]).toBe(-9);
                    }
                );
            });
        });

    describe('datasource with only 3 elements', function () {
        var scrollSettings = {datasource: 'myOnePageDatasource'};

        it('should create 3 divs with data (+ 2 padding divs)', function () {
            runTest(scrollSettings,
                function (viewport) {
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
                }
            );
        });

        it('should call get on the datasource 2 times ', function () {
            var spy;
            inject(function (myOnePageDatasource) {
                spy = spyOn(myOnePageDatasource, 'get').and.callThrough();
                runTest(scrollSettings,
                    function () {
                        expect(spy.calls.all().length).toBe(2);
                        expect(spy.calls.all()[0].args[0]).toBe(1);  // gets 3 rows (with eof)
                        expect(spy.calls.all()[1].args[0]).toBe(-9); // gets 0 rows (and bof)
                    });
            });
        });
    });

    describe('datasource with only 3 elements (negative index)', function () {
        var scrollSettings = { datasource: 'anotherDatasource' };
        it('should create 3 divs with data (+ 2 padding divs)', function () {
            runTest(scrollSettings,
                function (viewport) {
                    expect(viewport.children().length).toBe(5);

                    var row1 = viewport.children()[1];
                    expect(row1.tagName.toLowerCase()).toBe('div');
                    expect(row1.innerHTML).toBe('-2: item-2');

                    var row2 = viewport.children()[2];
                    expect(row2.tagName.toLowerCase()).toBe('div');
                    expect(row2.innerHTML).toBe('-1: item-1');

                    var row3 = viewport.children()[3];
                    expect(row3.tagName.toLowerCase()).toBe('div');
                    expect(row3.innerHTML).toBe('0: item0');
                }
            );
        });

        it('should call get on the datasource 2 times ', function () {
            var spy;
            inject(function (anotherDatasource) {
                spy = spyOn(anotherDatasource, 'get').and.callThrough();
                runTest(scrollSettings,
                    function () {
                        expect(spy.calls.all().length).toBe(2);

                        expect(spy.calls.all()[0].args[0]).toBe(1);  // gets 0 rows (and eof)
                        expect(spy.calls.all()[1].args[0]).toBe(-9); // gets 3 rows (and bof)
                    });
            });
        });
    });

    describe('datasource with 20 elements and buffer size 3 - constrained viewport', function () {
        var scrollSettings = { datasource: 'myMultipageDatasource', itemHeight: 40, bufferSize: 3 };

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

        it('should call get on the datasource 3 times ', function () {
            var spy;
            inject(function (myMultipageDatasource) {
                spy = spyOn(myMultipageDatasource, 'get').and.callThrough();
            });
            runTest(scrollSettings,
                function () {
                    expect(spy.calls.all().length).toBe(3);

                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(-2);
                }
            );
        });

        it('should create 3 more divs (9 divs total) with data (+ 2 padding divs)', function () {
            runTest(scrollSettings,
                function (viewport) {
                    viewport.scrollTop(100);
                    viewport.trigger('scroll');
                    inject(function ($timeout) {
                        $timeout.flush();
                        expect(viewport.children().length).toBe(11);
                        expect(viewport.scrollTop()).toBe(40);
                        expect(viewport.children().css('height')).toBe('0px');
                        expect(angular.element(viewport.children()[10]).css('height')).toBe('0px');

                        for (var i = 1; i < 10; i++) {
                            var row = viewport.children()[i];
                            expect(row.tagName.toLowerCase()).toBe('div');
                            expect(row.innerHTML).toBe(i + ': item' + i);
                        }
                    });
                }
            );
        });

        it('should call get on the datasource 1 extra time (4 total) ', function () {
            var spy;
            inject(function (myMultipageDatasource) {
                spy = spyOn(myMultipageDatasource, 'get').and.callThrough();
            });
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    viewport.scrollTop(100);
                    viewport.trigger('scroll');
                    $timeout.flush();

                    expect(spy.calls.all().length).toBe(4);

                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(-2);
                    expect(spy.calls.all()[3].args[0]).toBe(7);
                }
            );
        });

        it('should clip 3 divs from the top and add 3 more divs to the bottom (9 divs total) (+ 2 padding divs)', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {

                    viewport.scrollTop(100);
                    viewport.trigger('scroll');
                    $timeout.flush();

                    viewport.scrollTop(400);
                    viewport.trigger('scroll');
                    $timeout.flush();

                    expect(viewport.children().length).toBe(11);
                    expect(viewport.scrollTop()).toBe(160);
                    expect(viewport.children().css('height')).toBe('120px');
                    expect(angular.element(viewport.children()[10]).css('height')).toBe('0px');

                    for (var i = 1; i < 10; i++) {
                        var row = viewport.children()[i];
                        expect(row.tagName.toLowerCase()).toBe('div');
                        expect(row.innerHTML).toBe((i + 3) + ': item' + (i + 3));
                    }
                }
            );
        });

        it('should call get on the datasource 1 more time (4 total) ', function () {
            var spy;
            inject(function (myMultipageDatasource) {
                spy = spyOn(myMultipageDatasource, 'get').and.callThrough();
            });
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {

                    viewport.scrollTop(100);
                    viewport.trigger('scroll');
                    $timeout.flush();

                    viewport.scrollTop(400);
                    viewport.trigger('scroll');
                    $timeout.flush();

                    expect(spy.calls.all().length).toBe(5);
                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(-2);
                    expect(spy.calls.all()[3].args[0]).toBe(7);
                    expect(spy.calls.all()[4].args[0]).toBe(10);
                }
            );
        });

        it('should re-add 3 divs at the top and clip 3 divs from the bottom (9 divs total) (+ 2 padding divs)', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    var flush = $timeout.flush;

                    viewport.scrollTop(100);
                    viewport.trigger('scroll');
                    flush();

                    viewport.scrollTop(400);
                    viewport.trigger('scroll');
                    flush();

                    viewport.scrollTop(0);
                    viewport.trigger('scroll');
                    flush();

                    expect(viewport.children().length).toBe(8);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(viewport.children().css('height')).toBe('0px');
                    expect(angular.element(viewport.children()[7]).css('height')).toBe('240px');

                    for (var i = 1; i < 7; i++) {
                        var row = viewport.children()[i];
                        expect(row.tagName.toLowerCase()).toBe('div');
                        expect(row.innerHTML).toBe((i) + ': item' + (i));
                    }
                }
            );
        });

        it('should call get on the datasource 1 more time (4 total) ', function () {
            var spy;
            inject(function (myMultipageDatasource) {
                spy = spyOn(myMultipageDatasource, 'get').and.callThrough();
            });
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    var flush = $timeout.flush;

                    viewport.scrollTop(100);
                    viewport.trigger('scroll');
                    flush();

                    viewport.scrollTop(400);
                    viewport.trigger('scroll');
                    flush();

                    viewport.scrollTop(0);
                    viewport.trigger('scroll');
                    flush();

                    expect(spy.calls.all().length).toBe(7);
                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(-2);
                    expect(spy.calls.all()[3].args[0]).toBe(7);
                    expect(spy.calls.all()[4].args[0]).toBe(10);
                    expect(spy.calls.all()[5].args[0]).toBe(1);
                    expect(spy.calls.all()[6].args[0]).toBe(-2);

                }
            );
        });
    });

    describe('datasource with 12 elements and buffer size 3 (fold/edge cases)', function () {
        var itemsCount = 12, buffer = 3, itemHeight = 20;

        it('[full frame] should call get on the datasource 4 (12/3) times + 2 additional times (with empty result)', function () {
            var spy;
            var viewportHeight = itemsCount * itemHeight;

            inject(function (myEdgeDatasource) {
                spy = spyOn(myEdgeDatasource, 'get').and.callThrough();
            });

            runTest(
                {
                    datasource: 'myEdgeDatasource',
                    bufferSize: buffer,
                    viewportHeight: viewportHeight,
                    itemHeight: itemHeight
                },
                function () {
                    expect(spy.calls.all().length).toBe(parseInt(itemsCount / buffer, 10) + 2);

                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(7);
                    expect(spy.calls.all()[3].args[0]).toBe(-2);
                    expect(spy.calls.all()[4].args[0]).toBe(-5);
                    expect(spy.calls.all()[5].args[0]).toBe(-8);
                }
            );
        });

        it('[fold frame] should call get on the datasource 3 times', function () {
            var spy;
            var viewportHeight = buffer * itemHeight;

            inject(function (myEdgeDatasource) {
                spy = spyOn(myEdgeDatasource, 'get').and.callThrough();
            });

            runTest(
                {
                    datasource: 'myEdgeDatasource',
                    bufferSize: buffer,
                    viewportHeight: viewportHeight,
                    itemHeight: itemHeight
                },
                function () {
                    expect(spy.calls.all().length).toBe(3);

                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(-2);
                }
            );
        });

        it('[fold frame, scroll down] should call get on the datasource 1 extra time', function () {
            var spy;
            var viewportHeight = buffer * itemHeight;

            inject(function (myEdgeDatasource) {
                spy = spyOn(myEdgeDatasource, 'get').and.callThrough();
            });

            runTest(
                {
                    datasource: 'myEdgeDatasource',
                    bufferSize: buffer,
                    viewportHeight: viewportHeight,
                    itemHeight: itemHeight
                },
                function (viewport, scope, $timeout) {
                    var flush = $timeout.flush;
                    viewport.scrollTop(viewportHeight + itemHeight);
                    viewport.trigger('scroll');
                    flush();
                    viewport.scrollTop(viewportHeight + itemHeight * 2);
                    viewport.trigger('scroll');
                    flush();
                    expect(flush).toThrow();

                    expect(spy.calls.all().length).toBe(4);

                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4); //last full
                    expect(spy.calls.all()[2].args[0]).toBe(-2);
                    expect(spy.calls.all()[3].args[0]).toBe(5); //empty

                }
            );
        });

        it('[fold frame, scroll up] should call get on the datasource 2 extra times', function () {
            var spy;
            var viewportHeight = buffer * itemHeight;

            inject(function (myEdgeDatasource) {
                spy = spyOn(myEdgeDatasource, 'get').and.callThrough();
            });

            runTest(
                {
                    datasource: 'myEdgeDatasource',
                    bufferSize: buffer,
                    viewportHeight: viewportHeight,
                    itemHeight: itemHeight
                },
                function (viewport, scope, $timeout) {
                    var flush = $timeout.flush;

                    viewport.scrollTop(0); //first full, scroll to -2
                    viewport.trigger('scroll');
                    flush();

                    viewport.scrollTop(0); //last full, scroll to -5, bof is reached
                    viewport.trigger('scroll');
                    flush();

                    expect(flush).toThrow();
                    viewport.scrollTop(0); //empty, no scroll occurred (-8)
                    viewport.trigger('scroll');
                    flush();

                    expect(flush).toThrow();

                    expect(spy.calls.all().length).toBe(5);
                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(-2); //first full
                    expect(spy.calls.all()[3].args[0]).toBe(-5); //last full
                    expect(spy.calls.all()[4].args[0]).toBe(-8); //empty
                }
            );
        });
    });

    describe('prevent unwanted scroll bubbling', function () {
        var scrollSettings = { datasource: 'myDatasourceToPreventScrollBubbling', bufferSize: 3, viewportHeight: 300 };
        var documentScrollBubblingCount = 0;

        var incrementDocumentScrollCount = function (event) {
            event = event.originalEvent || event;
            if (!event.defaultPrevented) {
                documentScrollBubblingCount++;
            }
        };
        var getNewWheelEvent = function () {
            var event = document.createEvent('MouseEvents');
            event.initEvent('mousewheel', true, true);
            event.wheelDelta = 120;
            return event;
        };

        it('should prevent wheel-event bubbling until bof is reached', function () {
            var spy;

            inject(function (myDatasourceToPreventScrollBubbling) {
                spy = spyOn(myDatasourceToPreventScrollBubbling, 'get').and.callThrough();
            });

            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    var wheelEventElement = viewport[0];
                    var flush = $timeout.flush;

                    angular.element(document.body).bind('mousewheel', incrementDocumentScrollCount); //spy for wheel-events bubbling

                    //simulate multiple wheel-scroll events within viewport

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //preventDefault will not occurred but the document will not scroll because of viewport will be scrolled
                    expect(documentScrollBubblingCount).toBe(1);

                    viewport.scrollTop(0);
                    viewport.trigger('scroll');

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //now we are at the top but preventDefault is occurred because of bof will be reached only after next scroll trigger
                    expect(documentScrollBubblingCount).toBe(1); //here! the only one prevented wheel-event

                    flush();

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //preventDefault will not occurred but document will not scroll because of viewport will be scrolled
                    expect(documentScrollBubblingCount).toBe(2);

                    viewport.scrollTop(0);
                    viewport.trigger('scroll'); //bof will be reached right after that

                    flush();

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //preventDefault will not occurred because of we are at the top and bof is reached
                    expect(documentScrollBubblingCount).toBe(3);

                    expect(flush).toThrow(); //there is no new data, bof is reached

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //preventDefault will not occurred because of we are at the top and bof is reached
                    expect(documentScrollBubblingCount).toBe(4);

                }, {
                    cleanupTest: function () {
                        angular.element(document.body).unbind('mousewheel', incrementDocumentScrollCount);
                    }
                }
            );
        });
    });

    describe('isLoading property: deep access and sync', function () {

        it('should get isLoading as an adapter property', function () {
            runTest({datasource: 'myOnePageDatasource', adapter: 'container.sub.adapter'},
                function (viewport, scope) {
                    expect(!!scope.container && !!scope.container.sub && !!scope.container.sub.adapter).toBe(true);
                    expect(typeof scope.container.sub.adapter.isLoading).toBe('boolean');
                }
            );
        });

        it('should get isLoading as a scope property', function () {
            runTest({datasource: 'myOnePageDatasource', isLoading: 'container.sub.isLoading'},
                function (viewport, scope) {
                    expect(!!scope.container && !!scope.container.sub).toBe(true);
                    expect(typeof scope.container.sub.isLoading).toBe('boolean');
                }
            );
        });

        it('should sync scope-isLoading with adapter-isLoading', function () {
            runTest({
                    datasource: 'myMultipageDatasource',
                    itemHeight: 40,
                    bufferSize: 3,
                    adapter: 'container1.adapter',
                    isLoading: 'container2.isLoading'
                },
                function (viewport, scope, $timeout) {
                    var isLoadingChangeCount = 0;

                    expect(!!scope.container1 && !!scope.container1.adapter && !!scope.container2).toBe(true);

                    scope.$watch('container2.isLoading', function(newValue, oldValue) {
                        switch(++isLoadingChangeCount) {
                            case 1: expect(newValue).toBe(false); expect(oldValue).toBe(false); break;
                            case 2: expect(newValue).toBe(true); expect(oldValue).toBe(false); break;
                            case 3: expect(newValue).toBe(false); expect(oldValue).toBe(true); break;
                        }
                        expect(scope.container1.adapter.isLoading).toBe(newValue);
                    });

                    viewport.scrollTop(100);
                    viewport.trigger('scroll');
                    $timeout.flush();

                    expect(isLoadingChangeCount).toBe(3);
                }
            );
        });

    });

    describe('paddings recalculation', function () {

        var viewportHeight = 60;
        var itemHeight = 10;
        var bufferSize = 3;

        var scrollSettings = {
            datasource: 'myInfiniteDatasource',
            viewportHeight: viewportHeight,
            itemHeight: itemHeight,
            bufferSize: bufferSize
        };

        it('should calculate top padding element\'s height', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    var topPaddingElement = angular.element(viewport.children()[0]);

                    var scrollDelta = itemHeight * bufferSize;
                    var limit = 6; // must be > 2 !
                    var i;

                    // scroll down (double speed) + expectation
                    for(i = 0; i < limit; i++) {
                        viewport.scrollTop(viewport.scrollTop() + 2 * scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();

                        expect(topPaddingElement.height()).toBe(itemHeight * bufferSize * (i + 1));
                    }

                    // scroll up (normal speed) + expectation
                    for(i = limit - 1; i >= 0; i--) {
                        expect(topPaddingElement.height()).toBe(itemHeight * bufferSize * (i + 1));

                        viewport.scrollTop(viewport.scrollTop() - scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();
                    }

                }
            );
        });

        it('should calculate top padding element\'s height with new rows pre-built', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    var topPaddingElement = angular.element(viewport.children()[0]);

                    var scrollDelta = itemHeight * bufferSize;
                    var limit = 6; // must be > 2 !
                    var i;

                    // scroll down, new rows building
                    for(i = 0; i < limit; i++) {
                        viewport.scrollTop(viewport.scrollTop() + scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();
                    }

                    // scroll up, return to the top
                    for(i = 0; i < limit; i++) {
                        viewport.scrollTop(viewport.scrollTop() - scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();
                    }

                    // scroll down + expectation
                    for(i = 0; i < limit; i++) {
                        viewport.scrollTop(viewport.scrollTop() + scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();

                        expect(topPaddingElement.height()).toBe(itemHeight * bufferSize * (i + 1));
                        //console.log(topPaddingElement.height() + ' =?= ' + itemHeight * bufferSize * (i + 1));
                    }

                    // scroll up + expectation
                    for(i = limit - 1; i >= 0; i--) {
                        expect(topPaddingElement.height()).toBe(itemHeight * bufferSize * (i + 1));
                        //console.log(topPaddingElement.height() + ' =?= ' + itemHeight * bufferSize * (i + 1));

                        viewport.scrollTop(viewport.scrollTop() - scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();
                    }

                }
            );
        });

        it('should calculate bottom padding element\'s height with new rows pre-built', function () {
            runTest(scrollSettings,
                function (viewport, scope, $timeout) {
                    var bottomPaddingElement = angular.element(viewport.children()[viewport.children().length - 1]);

                    var scrollDelta = itemHeight * bufferSize;
                    var limit = 6; // must be > 2 !
                    var i;

                    // scroll up, new rows building
                    for(i = 0; i < limit; i++) {
                        viewport.scrollTop(viewport.scrollTop() - scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();
                    }

                    // scroll down, return to the bottom
                    for(i = 0; i < limit; i++) {
                        viewport.scrollTop(viewport.scrollTop() + scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();
                    }

                    // unstable delta passing
                    viewport.scrollTop(viewport.scrollTop() - 5);

                    // scroll up + expectation
                    for(i = 0; i < limit; i++) {
                        viewport.scrollTop(viewport.scrollTop() - scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();

                        expect(bottomPaddingElement.height()).toBe(itemHeight * bufferSize * (i + 1));
                        //console.log(bottomPaddingElement.height() + ' =?= ' + itemHeight * bufferSize * (i + 1));
                    }

                    // scroll down + expectation
                    for(i = limit - 1; i >= 0; i--) {
                        expect(bottomPaddingElement.height()).toBe(itemHeight * bufferSize * (i + 1));
                        //console.log(bottomPaddingElement.height() + ' =?= ' + itemHeight * bufferSize * (i + 1));

                        viewport.scrollTop(viewport.scrollTop() + scrollDelta);
                        viewport.trigger('scroll');
                        $timeout.flush();
                    }

                }
            );
        });

    });

});