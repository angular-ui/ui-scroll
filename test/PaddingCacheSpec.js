/*global describe, beforeEach, module, it, expect, runTest */
describe('uiScroll Paddings cache', function () {
  'use strict';

  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  describe('applyUpdates tests\n', function () {
    var scrollSettings = {
      datasource: 'myMultipageDatasource',
      adapter: 'adapter',
      itemHeight: 20,
      viewportHeight: 100
    };

    function getBottomPaddingHeight(viewport) {
      var viewportChildren = viewport.children();
      var bottomPadding = viewportChildren[viewportChildren.length - 1];
      return parseInt(angular.element(bottomPadding).css('height'), 10);
    }

    function getTopPaddingHeight(viewport) {
      var viewportChildren = viewport.children();
      var topPadding = viewportChildren[0];
      return parseInt(angular.element(topPadding).css('height'), 10);
    }

    var initialBottomHeight = 240;

    it('should delete last row when out of buffer', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          viewport.scrollTop(1000);
          viewport.trigger('scroll');
          viewport.scrollTop(1000);
          viewport.trigger('scroll');
          viewport.scrollTop(0);
          viewport.trigger('scroll');

          expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight);
          scope.adapter.applyUpdates(20, []);
          expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight - scrollSettings.itemHeight);

        }
      );
    });

    it('should delete first when row out of buffer', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          viewport.scrollTop(1000);
          viewport.trigger('scroll');
          viewport.scrollTop(1000);
          viewport.trigger('scroll');

          // expect(getTopPaddingHeight(viewport)).toBe(initialBottomHeight);
          // scope.adapter.applyUpdates(1, []);
          // expect(getTopPaddingHeight(viewport)).toBe(initialBottomHeight - scrollSettings.itemHeight);

        }
      );
    });

  });

});