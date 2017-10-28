/*global describe, beforeEach, module, it, expect, runTest */
describe('uiScroll Paddings cache', function () {
  'use strict';

  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  var itemsCount = 30;
  var itemHeight = 100;
  var viewportHeight = 500;
  var MAX = 3; // maximum scrolling interations to reach out the EOF/BOF

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

  function removeItem(datasource, index) {
    if(index >= datasource.min && index <= datasource.max) {
      var indexRemoved = datasource.data.indexOf(datasource.data[index - datasource.min]);
      datasource.data.splice(indexRemoved, 1);
      if(index === datasource.min) {
        datasource.min++;
      }
      else {
        datasource.max--;
      }
    }
  }

  function checkRow(viewport, row, content, tail = false) {
    var children = viewport.children();
    if(tail) {
      row = children.length - 1 - row;
    }
    var rowElement = children[row];
    expect(rowElement.innerHTML).toBe(content);
  }

  it('should set up properly', function () {
    var datasource;
    inject(function(myResponsiveDatasource) {
      datasource = myResponsiveDatasource;
    });
    runTest(scrollSettings,
      function () {
        expect(datasource.min).toBe(1);
        expect(datasource.max).toBe(itemsCount);
      }
    );
  });

  describe('removing outside the buffer via indexed-based applyUpdates\n', function () {

    it('should delete last row', function () {
      var datasource;
      inject(function(myResponsiveDatasource) {
        datasource = myResponsiveDatasource;
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, MAX);
          scrollTop(viewport);

          var initialBottomHeight = getBottomPaddingHeight(viewport);
          removeItem(datasource, datasource.max);
          scope.adapter.applyUpdates(itemsCount, []);
          expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight - itemHeight);

          scrollBottom(viewport, MAX);
          expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight);
          checkRow(viewport, 1, (itemsCount - 1) + ': item' + (itemsCount - 1), true);
        }
      );
    });

    it('should delete last row and then the next after last', function () {
      var datasource;
      inject(function(myResponsiveDatasource) {
        datasource = myResponsiveDatasource;
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, MAX);
          scrollTop(viewport);

          var initialBottomHeight = getBottomPaddingHeight(viewport);
          removeItem(datasource, datasource.max);
          scope.adapter.applyUpdates(itemsCount, []);
          removeItem(datasource, datasource.max);
          scope.adapter.applyUpdates(itemsCount - 1, []);
          expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight - itemHeight * 2);

          scrollBottom(viewport, MAX);
          expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight * 2);
          checkRow(viewport, 1, (itemsCount - 2) + ': item' + (itemsCount - 2), true);
        }
      );
    });

    it('should delete pre-last row', function () {
      var datasource;
      inject(function(myResponsiveDatasource) {
        datasource = myResponsiveDatasource;
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, MAX);
          scrollTop(viewport);

          var initialBottomHeight = getBottomPaddingHeight(viewport);
          removeItem(datasource, datasource.max - 1);
          scope.adapter.applyUpdates(itemsCount - 1, []);
          expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight - itemHeight);

          scrollBottom(viewport, MAX);
          expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight);
          checkRow(viewport, 1, (itemsCount - 1) + ': item' + itemsCount, true);
          checkRow(viewport, 2, (itemsCount - 2) + ': item' + (itemsCount - 2), true);
        }
      );
    });

    it('should delete first row', function () {
      var datasource;
      inject(function(myResponsiveDatasource) {
        datasource = myResponsiveDatasource;
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, MAX);

          var initialTopHeight = getTopPaddingHeight(viewport);
          removeItem(datasource, datasource.min);
          scope.adapter.applyUpdates(1, []);
          expect(getTopPaddingHeight(viewport)).toBe(initialTopHeight - itemHeight);

          scrollTop(viewport);
          expect(getTopPaddingHeight(viewport)).toBe(0);
          checkRow(viewport, 1, '2: item2');
        }
      );
    });

    it('should delete first row and then the next after first', function () {
      var datasource;
      inject(function(myResponsiveDatasource) {
        datasource = myResponsiveDatasource;
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, MAX);

          var initialTopHeight = getTopPaddingHeight(viewport);
          removeItem(datasource, datasource.min);
          scope.adapter.applyUpdates(1, []);
          removeItem(datasource, datasource.min);
          scope.adapter.applyUpdates(2, []);
          expect(getTopPaddingHeight(viewport)).toBe(initialTopHeight - itemHeight * 2);

          scrollTop(viewport);
          expect(getTopPaddingHeight(viewport)).toBe(0);
          checkRow(viewport, 1, '3: item3');
        }
      );
    });

    it('should delete second', function () {
      var datasource;
      inject(function(myResponsiveDatasource) {
        datasource = myResponsiveDatasource;
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          scrollBottom(viewport, MAX);

          var initialTopHeight = getTopPaddingHeight(viewport);
          removeItem(datasource, datasource.min  + 1);
          scope.adapter.applyUpdates(2, []);
          expect(getTopPaddingHeight(viewport)).toBe(initialTopHeight - itemHeight * 1);

          scrollTop(viewport);
          expect(getTopPaddingHeight(viewport)).toBe(0);
          checkRow(viewport, 1, '1: item1');
          checkRow(viewport, 2, '2: item3');
        }
      );
    });

  });

  describe('removing inside the buffer\n', function () {

    it('should delete second row via index-based applyUpdates', function () {
      var datasource;
      inject(function(myResponsiveDatasource) {
        datasource = myResponsiveDatasource;
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          removeItem(datasource, datasource.min + 1);
          scope.adapter.applyUpdates(2, []);

          checkRow(viewport, 1, '1: item1');
          checkRow(viewport, 2, '2: item3');

          scrollBottom(viewport, MAX);
          scrollTop(viewport);

          expect(getTopPaddingHeight(viewport)).toBe(0);
          checkRow(viewport, 1, '1: item1');
          checkRow(viewport, 2, '2: item3');
        }
      );
    });

    it('should delete second row via function-based applyUpdates', function () {
      var datasource;
      inject(function(myResponsiveDatasource) {
        datasource = myResponsiveDatasource;
      });
      runTest(scrollSettings,
        function (viewport, scope) {

          removeItem(datasource, datasource.min + 1);
          scope.adapter.applyUpdates(function(item) {
            if(item === 'item2') {
              return [];
            }
          });

          checkRow(viewport, 1, '1: item1');
          checkRow(viewport, 2, '2: item3');

          scrollBottom(viewport, MAX);
          scrollTop(viewport);

          expect(getTopPaddingHeight(viewport)).toBe(0);
          checkRow(viewport, 1, '1: item1');
          checkRow(viewport, 2, '2: item3');
        }
      );
    });

  });

});