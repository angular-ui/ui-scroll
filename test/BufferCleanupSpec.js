describe('uiScroll', () => {
  'use strict';

  let datasource;
  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  const injectDatasource = datasourceToken =>
    beforeEach(
      inject([datasourceToken, _datasource =>
        datasource = _datasource
      ])
    );

  describe('buffer cleanup', () => {
    const settings = {
      datasource: 'myEdgeDatasource', // items range is [-5..6]
      adapter: 'adapter',
      viewportHeight: 60,
      itemHeight: 20,
      padding: 0.3,
      startIndex: 3,
      bufferSize: 3
    };

    injectDatasource('myEdgeDatasource');

    const cleanBuffer = (scope, applyUpdateOptions) => {
      const get = datasource.get;
      const removedItems = [];
      // sync the datasource
      datasource.get = (index, count, success) => {
        if (removedItems.indexOf('item' + index) !== -1) {
          index += removedItems.length;
        }
        get(index, count, success);
      };
      // clean up the buffer
      scope.adapter.applyUpdates(item => {
        removedItems.push(item);
        return [];
      }, applyUpdateOptions);
    };

    const shouldWorkWhenEOF = (viewport, scope, options) => {
      expect(scope.adapter.isBOF()).toBe(false);
      expect(scope.adapter.isEOF()).toBe(true);
      expect(scope.adapter.bufferFirst).toBe('item0');
      expect(scope.adapter.bufferLast).toBe('item6');

      // remove items 0..6 items form -5..6 datasource
      cleanBuffer(scope, options);

      // result [-5..-1]
      expect(scope.adapter.isBOF()).toBe(true);
      expect(scope.adapter.isEOF()).toBe(true);
      expect(Helper.getRow(viewport, 1)).toBe('-5: item-5');
      expect(Helper.getRow(viewport, 2)).toBe('-4: item-4');
      expect(Helper.getRow(viewport, 3)).toBe('-3: item-3');
      expect(Helper.getRow(viewport, 4)).toBe('-2: item-2');
      expect(Helper.getRow(viewport, 5)).toBe('-1: item-1');
      expect(scope.adapter.bufferLength).toBe(5);
    };

    it('should be consistent on forward direction when eof with immutabeTop', () =>
      runTest(settings, (viewport, scope) =>
        shouldWorkWhenEOF(viewport, scope, { immutableTop: true })
      )
    );

    it('should be consistent on forward direction when eof without immutabeTop', () =>
      runTest(settings, (viewport, scope) =>
        shouldWorkWhenEOF(viewport, scope)
      )
    );

    const shouldWorkWhenNotEOF = (viewport, scope, options) => {
      expect(scope.adapter.isBOF()).toBe(false);
      expect(scope.adapter.isEOF()).toBe(false);
      expect(scope.adapter.bufferFirst).toBe('item-4');
      expect(scope.adapter.bufferLast).toBe('item1');

      // remove items -4..1 items form -5..6 datasource
      cleanBuffer(scope, options);

      // result [-5, 2, 3, 4]
      expect(scope.adapter.isBOF()).toBe(true);
      expect(scope.adapter.isEOF()).toBe(false);
      expect(Helper.getRow(viewport, 1)).toBe('-5: item-5');
      expect(Helper.getRow(viewport, 2)).toBe('-4: item2');
      expect(Helper.getRow(viewport, 3)).toBe('-3: item3');
      expect(Helper.getRow(viewport, 4)).toBe('-2: item4');
      expect(scope.adapter.bufferLength).toBe(4);
    };

    it('should be consistent on forward direction when not eof with immutabeTop', () =>
      runTest({
        ...settings,
        startIndex: -1,
        viewportHeight: 40
      }, (viewport, scope) =>
        shouldWorkWhenNotEOF(viewport, scope, { immutableTop: true })
      )
    );

    it('should be consistent on forward direction when not eof without immutabeTop', () =>
      runTest({
        ...settings,
        startIndex: -1,
        viewportHeight: 40
      }, (viewport, scope) =>
        shouldWorkWhenNotEOF(viewport, scope)
      )
    );

    it('should be consistent on backward direction when bof with immutableTop', () =>
      runTest({
        ...settings,
        startIndex: -3,
        padding: 0.5
      }, (viewport, scope) => {
        expect(scope.adapter.isBOF()).toBe(true);
        expect(scope.adapter.isEOF()).toBe(false);
        expect(scope.adapter.bufferFirst).toBe('item-5');
        expect(scope.adapter.bufferLast).toBe('item1');

        // remove items -5..1 items form -5..6 datasource
        cleanBuffer(scope, { immutableTop: true });

        // result [2..6]
        expect(scope.adapter.isBOF()).toBe(true);
        expect(scope.adapter.isEOF()).toBe(true);
        expect(Helper.getRow(viewport, 1)).toBe('-5: item2');
        expect(Helper.getRow(viewport, 2)).toBe('-4: item3');
        expect(Helper.getRow(viewport, 3)).toBe('-3: item4');
        expect(Helper.getRow(viewport, 4)).toBe('-2: item5');
        expect(Helper.getRow(viewport, 5)).toBe('-1: item6');
        expect(scope.adapter.bufferLength).toBe(5);
      })
    );

    it('should be consistent on backward direction when bof without immutableTop', () =>
      runTest({
        ...settings,
        startIndex: -3,
        padding: 0.5
      }, (viewport, scope) => {
        expect(scope.adapter.isBOF()).toBe(true);
        expect(scope.adapter.isEOF()).toBe(false);
        expect(scope.adapter.bufferFirst).toBe('item-5');
        expect(scope.adapter.bufferLast).toBe('item1');

        // remove items -5..1 items form -5..6 datasource
        cleanBuffer(scope);

        // result [2..6]
        expect(scope.adapter.isBOF()).toBe(true);
        expect(scope.adapter.isEOF()).toBe(true);
        expect(Helper.getRow(viewport, 1)).toBe('2: item2');
        expect(Helper.getRow(viewport, 2)).toBe('3: item3');
        expect(Helper.getRow(viewport, 3)).toBe('4: item4');
        expect(Helper.getRow(viewport, 4)).toBe('5: item5');
        expect(Helper.getRow(viewport, 5)).toBe('6: item6');
        expect(scope.adapter.bufferLength).toBe(5);
      })
    );

    const shouldWorkWhenNotBOF = (viewport, scope, options) => {
      expect(scope.adapter.isBOF()).toBe(false);
      expect(scope.adapter.isEOF()).toBe(false);
      expect(scope.adapter.bufferFirst).toBe('item-4');
      expect(scope.adapter.bufferLast).toBe('item2');

      // remove items -4..2 items form -5..6 datasource
      cleanBuffer(scope, options);

      // result [-5, 3, 4, 5, 6]
      expect(scope.adapter.isBOF()).toBe(true);
      expect(scope.adapter.isEOF()).toBe(true);
      expect(Helper.getRow(viewport, 1)).toBe('-5: item-5');
      expect(Helper.getRow(viewport, 2)).toBe('-4: item3');
      expect(Helper.getRow(viewport, 3)).toBe('-3: item4');
      expect(Helper.getRow(viewport, 4)).toBe('-2: item5');
      expect(Helper.getRow(viewport, 5)).toBe('-1: item6');
      expect(scope.adapter.bufferLength).toBe(5);
    };

    it('should be consistent on backward direction when not bof with immutableTop', () =>
      runTest({
        ...settings,
        startIndex: -1,
        padding: 0.3
      }, (viewport, scope) =>
        shouldWorkWhenNotBOF(viewport, scope, { immutableTop: true })
      )
    );

    it('should be consistent on backward direction when not bof without immutableTop', () =>
      runTest({ 
        ...settings,
        startIndex: -1,
        padding: 0.3
      }, (viewport, scope) =>
        shouldWorkWhenNotBOF(viewport, scope)
      )
    );
  });

});
