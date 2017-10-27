/*global describe, beforeEach, module, it, expect, runTest */
describe('uiScroll Paddings cache', function () {
  'use strict';

  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  describe('applyUpdates out of buffer\n', function () {
    var itemsCount = 30;
    var itemHeight = 100;
    var viewportHeight = 500;

    var scrollSettings = {
      datasource: 'myResponsiveDatasource',
      adapter: 'adapter',
      itemHeight: itemHeight,
      viewportHeight: viewportHeight
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

    function scrollBottom(viewport, count = 1) {
      for (var i = 0; i < count; i++) {
        viewport.scrollTop(99999);
        viewport.trigger('scroll');
      }
    }

    function scrollTop(viewport, count = 1) {
      for (var i = 0; i < count; i++) {
        viewport.scrollTop(0);
        viewport.trigger('scroll');
      }
    }

    it('should delete last row when out of buffer', function () {
      var removeLastItem;
      inject(function(myResponsiveDatasource) {
        var datasource = myResponsiveDatasource;
        removeLastItem = function() {
          datasource.data.slice(-1, 1);
          datasource.max--;
        };
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, 3);
          scrollTop(viewport);

          var initialBottomHeight = getBottomPaddingHeight(viewport);
          removeLastItem();
          scope.adapter.applyUpdates(itemsCount, []);
          expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight - itemHeight);

          scrollBottom(viewport, 3);
          expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight );
        }
      );
    });

    it('should delete last row and then the next after last, when out of buffer', function () {
      var removeLastItem;
      inject(function(myResponsiveDatasource) {
        var datasource = myResponsiveDatasource;
        removeLastItem = function() {
          datasource.data.slice(-1, 1);
          datasource.max--;
        };
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, 3);
          scrollTop(viewport);

          var initialBottomHeight = getBottomPaddingHeight(viewport);
          removeLastItem();
          scope.adapter.applyUpdates(itemsCount, []);
          removeLastItem();
          scope.adapter.applyUpdates(itemsCount - 1, []);
          expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight - itemHeight * 2);

          scrollBottom(viewport, 3);
          expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight * 2);
        }
      );
    });

    it('should delete first row when out of buffer', function () {
      var removeFirstItem;
      inject(function(myResponsiveDatasource) {
        var datasource = myResponsiveDatasource;
        removeFirstItem = function() {
          datasource.data.shift();
          datasource.min++;
        };
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, 3);

          var initialTopHeight = getTopPaddingHeight(viewport);
          removeFirstItem();
          scope.adapter.applyUpdates(1, []);
          expect(getTopPaddingHeight(viewport)).toBe(initialTopHeight - itemHeight);

          scrollTop(viewport);
          expect(getTopPaddingHeight(viewport)).toBe(0);
        }
      );
    });

    it('should delete first row and then the next after first, when out of buffer', function () {
      var removeFirstItem;
      inject(function(myResponsiveDatasource) {
        var datasource = myResponsiveDatasource;
        removeFirstItem = function() {
          datasource.data.shift();
          datasource.min++;
        };
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, 3);

          var initialTopHeight = getTopPaddingHeight(viewport);
          removeFirstItem();
          scope.adapter.applyUpdates(1, []);
          removeFirstItem();
          scope.adapter.applyUpdates(2, []);
          expect(getTopPaddingHeight(viewport)).toBe(initialTopHeight - itemHeight * 2);

          scrollTop(viewport);
          expect(getTopPaddingHeight(viewport)).toBe(0);
        }
      );
    });

  });

});