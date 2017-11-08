/*global describe, beforeEach, module, inject, it, expect, runTest */
describe('uiScroll user min/max indicies.', () => {
  'use strict';

  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  var viewportHeight = 120;
  var itemHeight = 20;
  var bufferSize = 3;
  var userMinIndex = -99; // for 100 items
  var userMaxIndex = 100;

  var scrollSettings = {
    datasource: 'myInfiniteDatasource',
    viewportHeight: viewportHeight,
    itemHeight: itemHeight,
    bufferSize: bufferSize,
    adapter: 'adapter'
  };

  describe('Setting\n', () => {

    it('should calculate bottom padding element\'s height after user max index is set', () => {
      let setMaxIndex;
      inject(function(myInfiniteDatasource) {
        setMaxIndex = () =>myInfiniteDatasource.maxIndex = userMaxIndex;
      });
      runTest(scrollSettings,
        (viewport) => {
          const bottomPaddingElement = angular.element(viewport.children()[viewport.children().length - 1]);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);

          setMaxIndex();

          const virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(bottomPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);
        }
      );
    });

    it('should calculate top padding element\'s height after user min index is set', () => {
      let setMinIndex;
      inject(function(myInfiniteDatasource) {
        setMinIndex = () => myInfiniteDatasource.minIndex = userMinIndex;
      });
      runTest(scrollSettings,
        (viewport) => {
          const topPaddingElement = angular.element(viewport.children()[0]);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);

          setMinIndex();

          const virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(topPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * ((-1) * userMinIndex + 1));
        }
      );
    });

  });

  describe('Pre-setting\n', () => {

    it('should work with maxIndex pre-set on datasource', () => {
      inject(function(myInfiniteDatasource) {
        myInfiniteDatasource.maxIndex = userMaxIndex;
      });
      runTest(scrollSettings,
        (viewport) => {
          const bottomPaddingElement = angular.element(viewport.children()[viewport.children().length - 1]);
          const virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(bottomPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);
        }
      );
    });

    it('should work with minIndex pre-set on datasource', () => {
      inject(function(myInfiniteDatasource) {
        myInfiniteDatasource.minIndex = userMinIndex;
      });
      runTest(scrollSettings,
        (viewport) => {
          const topPaddingElement = angular.element(viewport.children()[0]);
          const virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(topPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * ((-1) * userMinIndex + 1));
        }
      );
    });

  });

  describe('Reload\n', () => {

    it('should persist user maxIndex after reload', () => {
      inject(function(myInfiniteDatasource) {
        myInfiniteDatasource.maxIndex = userMaxIndex;
      });
      runTest(scrollSettings,
        (viewport, scope) => {
          scope.adapter.reload();
          const bottomPaddingElement = angular.element(viewport.children()[viewport.children().length - 1]);
          const virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(bottomPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);
        }
      );
    });

    it('should persist user minIndex after reload', () => {
      inject(function(myInfiniteDatasource) {
        myInfiniteDatasource.minIndex = userMinIndex;
      });
      runTest(scrollSettings,
        (viewport, scope) => {
          scope.adapter.reload();
          const topPaddingElement = angular.element(viewport.children()[0]);
          const virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(topPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * ((-1) * userMinIndex + 1));
        }
      );
    });

  });

});