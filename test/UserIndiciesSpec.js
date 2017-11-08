/*global describe, beforeEach, module, inject, it, expect, runTest */
describe('uiScroll user min/max indicies.', () => {
  'use strict';

  let datasource;
  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));
  beforeEach(
    inject(function(myInfiniteDatasource) {
      datasource = myInfiniteDatasource;
    })
  );

  const viewportHeight = 120;
  const itemHeight = 20;
  const bufferSize = 3;
  const userMinIndex = -99; // for 100 items
  const userMaxIndex = 100;

  const scrollSettings = {
    datasource: 'myInfiniteDatasource',
    viewportHeight: viewportHeight,
    itemHeight: itemHeight,
    bufferSize: bufferSize,
    adapter: 'adapter'
  };

  describe('Setting\n', () => {

    it('should calculate bottom padding element\'s height after user max index is set', () =>
      runTest(scrollSettings,
        (viewport) => {
          const bottomPaddingElement = angular.element(viewport.children()[viewport.children().length - 1]);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);

          datasource.maxIndex = userMaxIndex;

          const virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(bottomPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);
        }
      )
    );

    it('should calculate top padding element\'s height after user min index is set', () =>
      runTest(scrollSettings,
        (viewport) => {
          const topPaddingElement = angular.element(viewport.children()[0]);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);

          datasource.minIndex = userMinIndex;

          const virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(topPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * ((-1) * userMinIndex + 1));
        }
      )
    );

  });

  describe('Pre-setting\n', () => {

    it('should work with maxIndex pre-set on datasource', () => {
      datasource.maxIndex = userMaxIndex;
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
      datasource.minIndex = userMinIndex;
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
      datasource.maxIndex = userMaxIndex;
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
      datasource.minIndex = userMinIndex;
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