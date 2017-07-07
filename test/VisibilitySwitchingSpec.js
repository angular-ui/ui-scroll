/*global describe, beforeEach, module, it, expect, runTest */
describe('uiScroll visibility. ', function() {
  'use strict';

  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  var getScrollSettings = function() {
    return {
      datasource: 'myMultipageDatasource',
      viewportHeight: 200,
      itemHeight: 40,
      bufferSize: 3,
      adapter: 'adapter'
    };
  };

  var checkContent = function(rows, count) {
    for (var i = 1; i < count - 1; i++) {
      var row = rows[i];
      expect(row.tagName.toLowerCase()).toBe('div');
      expect(row.innerHTML).toBe(i + ': item' + i);
    }
  };

  describe('Viewport visibility changing. ', function() {
    var onePackItemsCount = 3 + 2;
    var twoPacksItemsCount = 3 * 3 + 2;

    it('Should create 9 divs with data (+ 2 padding divs).', function() {
      runTest(getScrollSettings(),
        function(viewport) {
          expect(viewport.children().length).toBe(twoPacksItemsCount);
          expect(viewport.scrollTop()).toBe(0);
          expect(viewport.children().css('height')).toBe('0px');
          expect(angular.element(viewport.children()[twoPacksItemsCount - 1]).css('height')).toBe('0px');
          checkContent(viewport.children(), twoPacksItemsCount);
        }
      );
    });

    it('Should preserve elements after visibility switched off (display:none).', function() {
      runTest(getScrollSettings(),
        function(viewport, scope) {
          viewport.css('display', 'none');
          scope.$apply();

          expect(viewport.children().length).toBe(twoPacksItemsCount);
          expect(viewport.scrollTop()).toBe(0);
          expect(viewport.children().css('height')).toBe('0px');
          expect(angular.element(viewport.children()[twoPacksItemsCount - 1]).css('height')).toBe('0px');
          checkContent(viewport.children(), twoPacksItemsCount);
        }
      );
    });


    it('Should only load one batch with visibility switched off (display:none).', function() {
      runTest(getScrollSettings(),
        function(viewport, scope) {
          viewport.css('display', 'none');
          scope.adapter.reload();

          expect(viewport.children().length).toBe(onePackItemsCount);
          expect(viewport.scrollTop()).toBe(0);
          expect(viewport.children().css('height')).toBe('0px');
          expect(angular.element(viewport.children()[onePackItemsCount - 1]).css('height')).toBe('0px');
          checkContent(viewport.children(), onePackItemsCount);
        }
      );
    });

    it('Should load full set after css-visibility switched back on.', function() {
      var scrollSettings = getScrollSettings();
      runTest(scrollSettings,
        function(viewport, scope, $timeout) {
          viewport.css('display', 'none');
          scope.adapter.reload();

          viewport.css('display', 'block');
          scope.$apply();
          $timeout.flush();

          let rows = viewport.children();
          expect(rows.length).toBe(twoPacksItemsCount);
          expect(viewport.scrollTop()).toBe(0);
          expect(rows.css('height')).toBe('0px');
          expect(angular.element(rows[twoPacksItemsCount - 1]).css('height')).toBe('0px');
          checkContent(rows, onePackItemsCount);
        }
      );
    });

    it('Should load full set after scope-visibility switched back on.', function() {
      var scrollSettings = getScrollSettings();
      scrollSettings.wrapper = {
        start: '<div ng-if="show">',
        end: '</div>'
      };
      runTest(scrollSettings,
        function(viewport, scope, $timeout) {
          scope.show = false;
          scope.adapter.reload();
          scope.$apply();

          scope.show = true;
          scope.$apply();
          $timeout.flush();

          let rows = viewport.children().children();
          expect(rows.length).toBe(twoPacksItemsCount);
          expect(viewport.scrollTop()).toBe(0);
          expect(rows.css('height')).toBe('0px');
          expect(angular.element(rows[twoPacksItemsCount - 1]).css('height')).toBe('0px');
          checkContent(rows, onePackItemsCount);
        }, {
          scope: {
            show: true
          }
        }
      );
    });

    it('Should stay on the 1st item after the visibility is on (infinite list).', function() {
      var scrollSettings = getScrollSettings();
      scrollSettings.datasource = 'myInfiniteDatasource';
      scrollSettings.topVisible = 'topVisible';
      runTest(scrollSettings,
        function(viewport, scope, $timeout) {
          viewport.css('display', 'none');
          scope.adapter.reload();
          scope.$apply();

          viewport.css('display', 'block');
          scope.$apply();
          $timeout.flush();

          expect(scope.topVisible).toBe('item1');
        }
      );
    });
  });

  describe('Items visibility changing. ', function() {
    var scrollSettings = getScrollSettings();
    scrollSettings.itemHeight = '0';
    var onePackItemsCount = 3 + 2;
    var twoPacksItemsCount = 3 * 2 + 2;

    it('Should load only one batch with items height = 0', function() {
      runTest(scrollSettings,
        function(viewport) {

          expect(viewport.children().length).toBe(onePackItemsCount);
          expect(viewport.scrollTop()).toBe(0);
          checkContent(viewport.children(), onePackItemsCount);
        }
      );
    });

    it('Should continue loading after the height of some item switched to non-zero.', function() {
      runTest(scrollSettings,
        function(viewport, scope, $timeout) {

          angular.element(viewport.children()[onePackItemsCount - 2]).css('height', 40);
          expect(angular.element(viewport.children()[onePackItemsCount - 2]).css('height')).toBe('40px');
          scope.$apply();
          $timeout.flush();

          expect(viewport.children().length).toBe(twoPacksItemsCount);
          expect(viewport.scrollTop()).toBe(0);
          checkContent(viewport.children(), twoPacksItemsCount);
        }
      );
    });
  });


});
