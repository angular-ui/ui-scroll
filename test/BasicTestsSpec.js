describe('uiScroll', function () {
    'use strict';

    beforeEach(module('ui.scroll'));
    beforeEach(module('ui.scroll.test.datasources'));

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

    describe('datasource with 3 elements and buffersize 3 (new get signature)', function() {
        var scrollSettings = { datasource: 'myDescriptorOnePageDatasource', bufferSize: 3 };

        it('should call get on the datasource 3 times ', function () {
            var spy;
            inject(function (myDescriptorOnePageDatasource) {
                spy = spyOn(myDescriptorOnePageDatasource, 'get').and.callThrough();
                runTest(scrollSettings,
                    function () {
                        expect(spy.calls.all().length).toBe(3);
                        expect(spy.calls.all()[0].args[0].index).toBe(1);  // gets 3 rows (no eof)
                        expect(spy.calls.all()[0].args[0].count).toBe(3);
                        expect('append' in spy.calls.all()[0].args[0]).toBe(true);
                        expect(spy.calls.all()[0].args[0].append).toBeUndefined();
                        expect('prepend' in spy.calls.all()[0].args[0]).toBe(false);
                        expect(spy.calls.all()[1].args[0].index).toBe(4); // gets 0 rows (and eof)
                        expect(spy.calls.all()[1].args[0].count).toBe(3);
                        expect('append' in spy.calls.all()[1].args[0]).toBe(true);
                        expect(spy.calls.all()[1].args[0].append).toBe('three');
                        expect('prepend' in spy.calls.all()[1].args[0]).toBe(false);
                        expect(spy.calls.all()[2].args[0].index).toBe(-2); // gets 0 rows (and bof)
                        expect(spy.calls.all()[2].args[0].count).toBe(3);
                        expect('append' in spy.calls.all()[2].args[0]).toBe(false);
                        expect('prepend' in spy.calls.all()[2].args[0]).toBe(true);
                        expect(spy.calls.all()[2].args[0].prepend).toBe('one');
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
        var scrollSettings = { datasource: 'myMultipageDatasource', viewportHeight: 200, itemHeight: 40, bufferSize: 3 };

        it('should create 9 divs with data (+ 2 padding divs)', function () {
            runTest(scrollSettings,
              function (viewport) {
                var itemsLoaded = 9;
                var itemsWithPaddings = itemsLoaded + 2;
                expect(viewport.children().length).toBe(itemsWithPaddings);
                expect(viewport.scrollTop()).toBe(0);
                expect(Helper.getTopPadding(viewport)).toBe(0);
                expect(Helper.getBottomPadding(viewport)).toBe(0);

                for (var i = 1; i < itemsLoaded; i++) {
                  var row = viewport.children()[i];
                  expect(row.tagName.toLowerCase()).toBe('div');
                  expect(row.innerHTML).toBe(i + ': item' + i);
                }
              }
            );
        });

        it('should call get on the datasource 4 times ', function () {
          var spy;
          inject(function (myMultipageDatasource) {
              spy = spyOn(myMultipageDatasource, 'get').and.callThrough();
          });
            runTest(scrollSettings,
                function () {
                    // There are 9 loaded items, so there were 3 data calls
                    // Additional call was for top items resulted with 0 items.
                    expect(spy.calls.all().length).toBe(4);

                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(7);
                    expect(spy.calls.all()[3].args[0]).toBe(-2);
                }
            );
        });

        it('should create 3 more divs (12 divs total) with data (+ 2 padding divs)', function () {
            var itemsLoaded = 12;
            var itemsWithPaddings = itemsLoaded + 2;
            runTest(scrollSettings,
                function (viewport) {
                    viewport.scrollTop(100);
                    inject(function () {
                        expect(viewport.children().length).toBe(itemsWithPaddings);
                        expect(viewport.scrollTop()).toBe(100);
                        expect(Helper.getTopPadding(viewport)).toBe(0);
                        expect(Helper.getBottomPadding(viewport)).toBe(0);

                        for (var i = 1; i < itemsLoaded; i++) {
                            var row = viewport.children()[i];
                            expect(row.tagName.toLowerCase()).toBe('div');
                            expect(row.innerHTML).toBe(i + ': item' + i);
                        }
                    });
                }
            );
        });

        it('should call get on the datasource 1 extra time (5 total) ', function () {
            var spy;
            inject(function (myMultipageDatasource) {
                spy = spyOn(myMultipageDatasource, 'get').and.callThrough();
            });
            runTest(scrollSettings,
                function (viewport) {
                    viewport.scrollTop(100);

                    expect(spy.calls.all().length).toBe(5);
                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(7);
                    expect(spy.calls.all()[3].args[0]).toBe(-2);
                    expect(spy.calls.all()[4].args[0]).toBe(10);
                }
            );
        });

        it('should clip 4 divs from the top and add 3 more divs to the bottom (11 divs total) (+ 2 padding divs)', function () {
            runTest(scrollSettings,
                function (viewport) {
                    var itemsLoaded = 11;
                    var itemsWithPaddings = itemsLoaded + 2;
                    var clippedDivs = 4;

                    viewport.scrollTop(100);
                    viewport.scrollTop(400);

                    expect(viewport.children().length).toBe(itemsWithPaddings);
                    expect(viewport.scrollTop()).toBe(280);
                    expect(Helper.getTopPadding(viewport)).toBe(160);
                    expect(Helper.getBottomPadding(viewport)).toBe(0);

                    for (var i = 1; i <= itemsLoaded; i++) {
                        var row = viewport.children()[i];
                        expect(row.tagName.toLowerCase()).toBe('div');
                        expect(row.innerHTML).toBe((i + clippedDivs) + ': item' + (i + clippedDivs));
                    }
                }
            );
        });

        it('should call get on the datasource 1 more time (6 total) ', function () {
            var spy;
            inject(function (myMultipageDatasource) {
                spy = spyOn(myMultipageDatasource, 'get').and.callThrough();
            });
            runTest(scrollSettings,
                function (viewport) {
                    var calls = 6;

                    viewport.scrollTop(100);
                    viewport.scrollTop(400);

                    expect(spy.calls.all().length).toBe(calls);
                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(7);
                    expect(spy.calls.all()[3].args[0]).toBe(-2);
                    expect(spy.calls.all()[4].args[0]).toBe(10);
                    expect(spy.calls.all()[5].args[0]).toBe(13);
                }
            );
        });

        it('should re-add 3 divs at the top and clip 2 divs from the bottom (9 divs total) (+ 2 padding divs)', function () {
            runTest(scrollSettings,
                function (viewport) {
                    var itemsLoaded = 8;
                    var itemsWithPaddings = itemsLoaded + 2;

                    viewport.scrollTop(100);
                    viewport.scrollTop(400);
                    viewport.scrollTop(0);

                    expect(viewport.children().length).toBe(itemsWithPaddings);
                    expect(viewport.scrollTop()).toBe(0);
                    expect(Helper.getTopPadding(viewport)).toBe(0);
                    expect(Helper.getBottomPadding(viewport)).toBe(280);

                    for (var i = 1; i <= itemsLoaded; i++) {
                        var row = viewport.children()[i];
                        expect(row.tagName.toLowerCase()).toBe('div');
                        expect(row.innerHTML).toBe((i) + ': item' + (i));
                    }
                }
            );
        });

        it('should call get on the datasource 1 more time (8 total) ', function () {
            var spy;
            inject(function (myMultipageDatasource) {
                spy = spyOn(myMultipageDatasource, 'get').and.callThrough();
            });

            runTest(scrollSettings,
                function (viewport) {
                    var totalCallsNumber = 8;

                    viewport.scrollTop(100);
                    viewport.scrollTop(400);
                    viewport.scrollTop(0);

                    expect(spy.calls.all().length).toBe(totalCallsNumber);
                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4);
                    expect(spy.calls.all()[2].args[0]).toBe(7);
                    expect(spy.calls.all()[3].args[0]).toBe(-2);
                    expect(spy.calls.all()[4].args[0]).toBe(10);
                    expect(spy.calls.all()[5].args[0]).toBe(13);
                    expect(spy.calls.all()[6].args[0]).toBe(2);
                    expect(spy.calls.all()[7].args[0]).toBe(-1);
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
                function (viewport) {
                    viewport.scrollTop(viewportHeight + itemHeight);
                    viewport.scrollTop(viewportHeight + itemHeight * 2);

                    expect(spy.calls.all().length).toBe(4);
                    expect(spy.calls.all()[0].args[0]).toBe(1);
                    expect(spy.calls.all()[1].args[0]).toBe(4); //last full
                    expect(spy.calls.all()[2].args[0]).toBe(-2);
                    expect(spy.calls.all()[3].args[0]).toBe(6); //empty

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
                function (viewport) {
                    viewport.scrollTop(0); //first full, scroll to -2
                    viewport.scrollTop(0); //last full, scroll to -5, bof is reached
                    viewport.scrollTop(0); //empty, no scroll occurred (-8)

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
                function (viewport) {
                    var wheelEventElement = viewport[0];

                    angular.element(document.body).bind('mousewheel', incrementDocumentScrollCount); //spy for wheel-events bubbling

                    //simulate multiple wheel-scroll events within viewport

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //preventDefault will not occurred but the document will not scroll because of viewport will be scrolled
                    expect(documentScrollBubblingCount).toBe(1);

                    viewport.scrollTop(0);

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //now we are at the top but preventDefault is occurred because of bof will be reached only after next scroll trigger
                    expect(documentScrollBubblingCount).toBe(2); //here! the only one prevented wheel-event

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //preventDefault will not occurred but document will not scroll because of viewport will be scrolled
                    expect(documentScrollBubblingCount).toBe(3);

                    viewport.scrollTop(0); //bof will be reached right after that

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //preventDefault will not occurred because of we are at the top and bof is reached
                    expect(documentScrollBubblingCount).toBe(4);

                    wheelEventElement.dispatchEvent(getNewWheelEvent()); //preventDefault will not occurred because of we are at the top and bof is reached
                    expect(documentScrollBubblingCount).toBe(5);

                }, {
                    cleanupTest: function () {
                        angular.element(document.body).unbind('mousewheel', incrementDocumentScrollCount);
                    }
                }
            );
        });
    });

    describe('calculation of the paddings', function () {

        var viewportHeight = 120;
        var itemHeight = 20;
        var bufferSize = 3;

        var scrollSettings = {
            datasource: 'myInfiniteDatasource',
            viewportHeight: viewportHeight,
            itemHeight: itemHeight,
            bufferSize: bufferSize
        };

        it('should calculate top padding element\'s height during scroll down', function () {
            runTest(scrollSettings,
                function (viewport) {
                    // scroll down + expectation
                    for(var i = 0; i < 6; i++) {
                        viewport.scrollTop(5000);
                        expect(Helper.getTopPadding(viewport)).toBe(itemHeight * bufferSize * (i + 1));
                    }
                }
            );
        });

        it('should calculate bottom padding element\'s height during scroll up', function () {
            runTest(scrollSettings,
                function (viewport) {
                    // scroll up + expectation
                    for(var i = 0; i < 6; i++) {
                        viewport.scrollTop(-5000);
                        expect(Helper.getBottomPadding(viewport)).toBe(itemHeight * bufferSize * (i + 1));
                    }

                }
            );
        });

        it('should calculate both padding elements heights during scroll down and up', function () {
            runTest(scrollSettings,
                function (viewport) {
                    var scrollDelta = itemHeight * bufferSize;
                    var i, scrollIteration = 7;

                    // scroll down + expectation
                    for(i = 0; i < scrollIteration; i++) {
                        viewport.scrollTop(viewport.scrollTop() + scrollDelta);
                        expect(Helper.getTopPadding(viewport)).toBe(itemHeight * bufferSize * (i + 1));
                        expect(Helper.getBottomPadding(viewport)).toBe(0);
                    }

                    // scroll up + expectation
                    for(i = 0; i < scrollIteration; i++) {
                        viewport.scrollTop(viewport.scrollTop() - scrollDelta);
                        expect(Helper.getTopPadding(viewport)).toBe(itemHeight * bufferSize * (scrollIteration - i - 1));
                        expect(Helper.getBottomPadding(viewport)).toBe(itemHeight * bufferSize * (i + 1));
                    }

                    // further scroll up + expectation
                    for(i = scrollIteration; i < 2*scrollIteration; i++) {
                      viewport.scrollTop(viewport.scrollTop() - scrollDelta);
                      expect(Helper.getTopPadding(viewport)).toBe(0);
                      expect(Helper.getBottomPadding(viewport)).toBe(itemHeight * bufferSize * (i + 1));
                    }
                }
            );
        });
    });

	describe('topVisible property: deep access and sync', function () {

		it('should get topVisible as an adapter property', function () {
			runTest({datasource: 'myMultipageDatasource', adapter: 'adapterContainer.innerContainer.adapter'},
				function (viewport, scope) {
					expect(!!scope.adapterContainer && !!scope.adapterContainer.innerContainer && !!scope.adapterContainer.innerContainer.adapter).toBe(true);
					expect(angular.isString(scope.adapterContainer.innerContainer.adapter.topVisible)).toBe(true);
				}
			);
		});

		it('should get topVisible as a scope property', function () {
			runTest({datasource: 'myMultipageDatasource', topVisible: 'scopeContainer.innerContainer.topVisible'},
				function (viewport, scope) {
					expect(!!scope.scopeContainer && !!scope.scopeContainer.innerContainer).toBe(true);
					expect(angular.isString(scope.scopeContainer.innerContainer.topVisible)).toBe(true);
				}
			);
		});

		it('should sync scope-topVisible with adapter-topVisible during each fetching', function () {
			runTest({
					datasource: 'myMultipageDatasource',
					itemHeight: 40,
					bufferSize: 3,
					adapter: 'container1.adapter',
					topVisible: 'container2.topVisible'
				},
				function (viewport, scope) {
					var topVisibleChangeCount = 0;

					scope.$watch('container1.adapter.topVisible', function(newValue) {
						if(newValue === 'item1') {
							return;
						}
						topVisibleChangeCount++;

						expect(scope.container1.adapter.topVisible).toBe(newValue);
						expect(scope.container2.topVisible).toBe(newValue);

						if(topVisibleChangeCount === 1) {
							expect(newValue).toBe('item3');
						}
						else if(topVisibleChangeCount === 2) {
							expect(newValue).toBe('item8');
						}
					});

					viewport.scrollTop(100); // 100 : 40 = 2.5 --> item3
                    viewport.scrollTop(300); // 300 : 40 = 7.5 --> item8
                    
					expect(topVisibleChangeCount).toBe(2);
				}
			);
		});

		it('should sync scope-topVisible with adapter-topVisible during each scrolling (single fetch case)', function () {
			runTest({
					datasource: 'myOneBigPageDatasource',
					itemHeight: 40,
					bufferSize: 3,
					adapter: 'container1.adapter',
					topVisible: 'container2.topVisible'
				},
				function (viewport, scope) {
					var topVisibleChangeCount = 0;

					scope.$watch('container1.adapter.topVisible', function(newValue) {
						if(newValue === 'item1') {
							return;
						}
						topVisibleChangeCount++;

						expect(scope.container1.adapter.topVisible).toBe(newValue);
						expect(scope.container2.topVisible).toBe(newValue);

						if(topVisibleChangeCount === 1) {
							expect(newValue).toBe('item3');
						}
						else if(topVisibleChangeCount === 2) {
							expect(newValue).toBe('item8');
						}
					});

					viewport.scrollTop(100); // 100 : 40 = 2.5 --> item3
					viewport.scrollTop(300); // 300 : 40 = 7.5 --> item8

					expect(topVisibleChangeCount).toBe(2);
				}
			);
		});

	});

	describe('disabled property', function () {

		it('should prevent datasource.get call', function () {
			var spy;
			inject(function (myInfiniteDatasource) {
				spy = spyOn(myInfiniteDatasource, 'get').and.callThrough();
			});

			runTest({datasource: 'myInfiniteDatasource', adapter: 'adapter'},
				function (viewport, scope) {
					scope.adapter.disabled = true;
					viewport.scrollTop(1000); // scroll to bottom

          expect(spy.calls.all().length).toBe(3); // just three initial requests
				}
			);
		});

		it('should fetch new data after disabled = false', function () {
			var spy;
			inject(function (myInfiniteDatasource) {
				spy = spyOn(myInfiniteDatasource, 'get').and.callThrough();
			});

			runTest({datasource: 'myInfiniteDatasource', adapter: 'adapter'},
				function (viewport, scope) {

					scope.adapter.disabled = true;
					viewport.scrollTop(1000); // scroll to bottom
					scope.adapter.disabled = false;

					expect(spy.calls.all().length).toBe(4); // 3 initial + 1 new requests
				}
			);
		});

	});

  describe('attributes scope binding', function () {
    var calls = 6;
    var bufferSize = 5;

    it('bufferSize scope binding should work (1)', function () {
      inject(function (myInfiniteDatasource) {
        var spy = spyOn(myInfiniteDatasource, 'get').and.callThrough();
        runTest({datasource: 'myInfiniteDatasource', bufferSize: bufferSize},
          function () {
            expect(spy.calls.all().length).toBe(calls);
          }
        );
      });
    });

    it('bufferSize scope binding should work (2)', function () {
      inject(function (myInfiniteDatasource) {
        var spy = spyOn(myInfiniteDatasource, 'get').and.callThrough();
        runTest({datasource: 'myInfiniteDatasource', bufferSize: 'start'},
          function () {
            expect(spy.calls.all().length).toBe(calls);
          }, {
            scope: {
              'start': bufferSize
            }
          }
        );
      });
    });
  });

  describe('interpolation', function() {
    var myTemplate = '<div ng-style="{\'height\': itemHeight + \'px\'}">{{$index}}: {{item}}</div>';
    var scrollSettings = {
      datasource: 'myInfiniteDatasource',
      template: myTemplate,
      topVisible: 'topVisible',
      bufferSize: 10
    };

    it('should keep 1st item at the top after initial auto fetching is done', function() {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.topVisible).toBe('item1');
          expect(viewport.scrollTop()).toBe(400); // 1 pack (bufferSize * itemHeight) from the top
        }, {
          scope: {
            'itemHeight': 40
          }
        }
      );
    });

    it('should keep (-bufferSize) item at the top after one manual fetching is done', function() {
      runTest(scrollSettings,
        function (viewport, scope) {

          viewport.scrollTop(0); // scroll to the very top

          expect(scope.topVisible).toBe('item-9');
          expect(viewport.scrollTop()).toBe(400); // 1 pack (bufferSize * itemHeight) from the top
        }, {
          scope: {
            'itemHeight': 40
          }
        }
      );
    });
  });

  describe('effective height', function() {
    var scrollSettings = {
      datasource: 'myInfiniteDatasource',
      topVisible: 'topVisible',
      bufferSize: 3,
      viewportHeight: 315
    };

    it('should break through negative value', function() {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.topVisible).toBe('item1');
        }
      );
    });
  });

});
