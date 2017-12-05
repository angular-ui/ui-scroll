describe('uiScroll', function() {
  'use strict';

  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  describe('basic setup', function() {

    it('should throw an error if the template\'s wrong', function() {
      runTest({ datasource: 'myEmptyDatasource', extra: 'ng-if="false"' }, null, {
          catch: function(error) {
            expect(error.message).toBe('ui-scroll directive requires an Element node for templating the view');
          }
        }
      );
    });

    var scrollSettings = { datasource: 'myEmptyDatasource' };

    it('should bind to window scroll and resize events and unbind them after the scope is destroyed', function() {
      spyOn($.fn, 'bind').and.callThrough();
      spyOn($.fn, 'unbind').and.callThrough();
      runTest(scrollSettings,
        function(viewport) {
          expect($.fn.bind.calls.all().length).toBe(3);
          expect($.fn.bind.calls.all()[0].args[0]).toBe('mousewheel');
          expect($.fn.bind.calls.all()[0].object[0]).toBe(viewport[0]);
          expect($.fn.bind.calls.all()[1].args[0]).toBe('resize');
          expect($.fn.bind.calls.all()[1].object[0]).toBe(viewport[0]);
          expect($.fn.bind.calls.all()[2].args[0]).toBe('scroll');
          expect($.fn.bind.calls.all()[2].object[0]).toBe(viewport[0]);
        }, {
          cleanupTest: function(viewport, scope, $timeout) {
            $timeout(function() {
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

    it('should create 2 divs of 0 height', function() {
      runTest(scrollSettings,
        function(viewport) {
          expect(viewport.children().length).toBe(2);

          var topPadding = viewport.children()[0];
          expect(topPadding.tagName.toLowerCase()).toBe('div');
          expect(Helper.getTopPadding(viewport)).toBe(0);

          var bottomPadding = viewport.children()[1];
          expect(bottomPadding.tagName.toLowerCase()).toBe('div');
          expect(Helper.getBottomPadding(viewport)).toBe(0);
        }
      );
    });

    it('should call get on the datasource 2 times ', function() {
      var spy;
      inject(function(myEmptyDatasource) {
        spy = spyOn(myEmptyDatasource, 'get').and.callThrough();
      });
      runTest(scrollSettings,
        function() {
          expect(spy.calls.all().length).toBe(2);
          expect(spy.calls.all()[0].args.length).toBe(3);
          expect(spy.calls.all()[0].args[0]).toBe(1);
          expect(spy.calls.all()[0].args[1]).toBe(10);
          expect(spy.calls.all()[1].args.length).toBe(3);
          expect(spy.calls.all()[1].args[0]).toBe(-9);
          expect(spy.calls.all()[1].args[1]).toBe(10);
        }
      );
    });
  });

  describe('basic setup (new datasource get signature)', function() {
    var scrollSettings = { datasource: 'myDescriptoEmptyDatasource' };

    it('should call get on the datasource 2 times ', function() {
      var spy;
      inject(function(myDescriptoEmptyDatasource) {
        spy = spyOn(myDescriptoEmptyDatasource, 'get').and.callThrough();
      });
      runTest(scrollSettings,
        function() {
          expect(spy.calls.all().length).toBe(2);
          expect(spy.calls.all()[0].args.length).toBe(2);
          expect(spy.calls.all()[0].args[0].index).toBe(1);
          expect(spy.calls.all()[0].args[0].count).toBe(10);
          expect('append' in spy.calls.all()[0].args[0]).toBe(true);
          expect(spy.calls.all()[0].args[0].append).toBeUndefined();
          expect('prepend' in spy.calls.all()[0].args[0]).toBe(false);
          expect(spy.calls.all()[1].args.length).toBe(2);
          expect(spy.calls.all()[1].args[0].index).toBe(-9);
          expect(spy.calls.all()[1].args[0].count).toBe(10);
          expect('append' in spy.calls.all()[1].args[0]).toBe(false);
          expect('prepend' in spy.calls.all()[1].args[0]).toBe(true);
          expect(spy.calls.all()[1].args[0].prepend).toBeUndefined();
        }
      );
    });
  });
});
