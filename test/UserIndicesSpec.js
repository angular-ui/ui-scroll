/*global describe, beforeEach, module, inject, it, expect, runTest, Helper */
describe('uiScroll main/max indices', function() {
  'use strict';

  let datasource;
  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  const injectDatasource = (datasourceToken) =>
    beforeEach(
      inject([datasourceToken, function(_datasource) {
        datasource = _datasource;
      }])
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
    injectDatasource('myInfiniteDatasource');

    it('should set up bottom padding element\'s height after user max index is set', () =>
      runTest(scrollSettings,
        (viewport) => {
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);

          datasource.maxIndex = userMaxIndex;

          const virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(Helper.getBottomPadding(viewport)).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);
        }
      )
    );

    it('should set up top padding element\'s height after user min index is set', () =>
      runTest(scrollSettings,
        (viewport) => {
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);

          datasource.minIndex = userMinIndex;

          const virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(Helper.getTopPadding(viewport)).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * ((-1) * userMinIndex + 1));
        }
      )
    );

  });

  describe('Pre-setting\n', () => {
    injectDatasource('myInfiniteDatasource');

    it('should work with maxIndex pre-set on datasource', () => {
      datasource.maxIndex = userMaxIndex;
      runTest(scrollSettings,
        (viewport) => {
          const virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(Helper.getBottomPadding(viewport)).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);
        }
      );
    });

    it('should work with minIndex pre-set on datasource', () => {
      datasource.minIndex = userMinIndex;
      runTest(scrollSettings,
        (viewport) => {
          const virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(Helper.getTopPadding(viewport)).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * ((-1) * userMinIndex + 1));
        }
      );
    });

    it('should work when the viewport is big enough to include more than 1 pack of item (last)', () => {
      const viewportHeight = 450;
      const _topItemsCount = Math.round(viewportHeight * 0.5 / itemHeight);
      const _topPackCount = Math.ceil(_topItemsCount / bufferSize);
      const _minIndex = (-1) * _topPackCount * bufferSize + 1; // one additinal adjustment should occur
      datasource.minIndex = _minIndex;
      datasource.maxIndex = userMaxIndex;
      runTest(Object.assign({}, scrollSettings, { viewportHeight }),
        (viewport) => {
          expect(Helper.getTopPadding(viewport)).toBe(0);
          expect(viewport.scrollTop()).toBe(_topPackCount * bufferSize * itemHeight);
        }
      );
    });

    it('should work when the viewport is big enough to include more than 1 pack of item (first)', () => {
      const viewportHeight = 450;
      const _topItemsCount = Math.round(viewportHeight * 0.5 / itemHeight);
      const _topPackCount = Math.ceil(_topItemsCount / bufferSize);
      let _minIndex = -1; // ~9 additinal adjustments should occur
      datasource.minIndex = _minIndex;
      datasource.maxIndex = userMaxIndex;
      runTest(Object.assign({}, scrollSettings, { viewportHeight }),
        (viewport) => {
          expect(Helper.getTopPadding(viewport)).toBe(0);
          expect(viewport.scrollTop()).toBe(_topPackCount * bufferSize * itemHeight);
        }
      );
    });

  });

  describe('Reload\n', () => {
    injectDatasource('myResponsiveDatasource');
    beforeEach(() => {
      datasource.min = userMinIndex;
      datasource.max = userMaxIndex;
      datasource.init();
    });

    it('should persist user maxIndex after reload', () => {
      datasource.maxIndex = userMaxIndex;
      runTest(Object.assign({}, scrollSettings, { datasource: 'myResponsiveDatasource' }),
        (viewport, scope) => {
          scope.adapter.reload();
          const virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(Helper.getBottomPadding(viewport)).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);
        }
      );
    });

    it('should persist user minIndex after reload', () => {
      datasource.minIndex = userMinIndex;
      runTest(Object.assign({}, scrollSettings, { datasource: 'myResponsiveDatasource' }),
        (viewport, scope) => {
          scope.adapter.reload();
          const virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(Helper.getTopPadding(viewport)).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * ((-1) * userMinIndex + 1));
        }
      );
    });

    it('should apply new user minIndex and maxIndex after reload', () => {
      const startIndex = 10;
      const add = 50;
      const minIndexNew = userMinIndex - add;
      const maxIndexNew = userMaxIndex + add;
      datasource.minIndex = userMinIndex;
      datasource.maxIndex = userMaxIndex;
      runTest(Object.assign({}, scrollSettings, { datasource: 'myResponsiveDatasource', startIndex }),
        (viewport, scope) => {
          const _scrollTop = viewport.scrollTop();

          scope.adapter.reload(startIndex);
          datasource.min = minIndexNew;
          datasource.max = maxIndexNew;
          datasource.minIndex = minIndexNew;
          datasource.maxIndex = maxIndexNew;

          expect(Helper.getTopPadding(viewport)).toBe(itemHeight * ((-1) * minIndexNew + startIndex - bufferSize));
          expect(Helper.getBottomPadding(viewport)).toBe(itemHeight * (maxIndexNew - startIndex + 1 - (viewportHeight / itemHeight) - bufferSize));
          expect(viewport.scrollTop()).toBe(_scrollTop + itemHeight * add);
        }
      );
    });

  });

});
