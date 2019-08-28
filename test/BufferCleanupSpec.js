describe('uiScroll', function () {
  'use strict';

  let datasource;
  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  const injectDatasource = (datasourceToken) =>
    beforeEach(
      inject([datasourceToken, function (_datasource) {
        datasource = _datasource;
      }])
    );

  describe('buffer cleanup', function () {
    var getSettings = function () {
      return {
        datasource: 'myEdgeDatasource',
        adapter: 'adapter',
        viewportHeight: 60,
        itemHeight: 20,
        padding: 0.3,
        startIndex: 3,
        bufferSize: 3
      };
    };

    injectDatasource('myEdgeDatasource');

    var cleanBuffer = function (scope, applyUpdateOptions) {
      var get = datasource.get;
      var removedItems = [];
      // sync the datasource
      datasource.get = function (index, count, success) {
        var removedIndex = removedItems.indexOf('item' + index);
        if (removedIndex !== -1) {
          // todo consider mutable-top case
          index += removedItems.length;// - removedIndex;
        }
        get(index, count, success);
      };
      // clean up the buffer
      scope.adapter.applyUpdates(function (item) {
        removedItems.push(item);
        return [];
      }, applyUpdateOptions);
    };

    var shouldWorkWhenEOF = function (viewport, scope, options) {
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

    it('should be consistent on forward direction when eof with immutabeTop', function () {
      runTest(getSettings(), function (viewport, scope) {
        shouldWorkWhenEOF(viewport, scope, { immutableTop: true });
      });
    });

    it('should be consistent on forward direction when eof without immutabeTop', function () {
      runTest(getSettings(), function (viewport, scope) {
        shouldWorkWhenEOF(viewport, scope);
      });
    });

    var shouldWorkWhenNotEOF = function (viewport, scope, options) {
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

    it('should be consistent on forward direction when not eof with immutabeTop', function () {
      var scrollSettings = getSettings();
      scrollSettings.startIndex = -1;
      scrollSettings.viewportHeight = 40;
      runTest(scrollSettings, function (viewport, scope) {
        shouldWorkWhenNotEOF(viewport, scope, { immutableTop: true });
      });
    });

    it('should be consistent on forward direction when not eof without immutabeTop', function () {
      var scrollSettings = getSettings();
      scrollSettings.startIndex = -1;
      scrollSettings.viewportHeight = 40;
      runTest(scrollSettings, function (viewport, scope) {
        shouldWorkWhenNotEOF(viewport, scope);
      });
    });

    var shouldWorkWhenBOF = function (viewport, scope, options) {
      expect(scope.adapter.isBOF()).toBe(true);
      expect(scope.adapter.isEOF()).toBe(false);
      expect(scope.adapter.bufferFirst).toBe('item-5');
      expect(scope.adapter.bufferLast).toBe('item1');

      // remove items -5..1 items form -5..6 datasource
      cleanBuffer(scope, options);

      // result [2..6]
      expect(scope.adapter.isBOF()).toBe(true);
      expect(scope.adapter.isEOF()).toBe(true);
      expect(Helper.getRow(viewport, 1)).toBe('2: item2');
      expect(Helper.getRow(viewport, 2)).toBe('3: item3');
      expect(Helper.getRow(viewport, 3)).toBe('4: item4');
      expect(Helper.getRow(viewport, 4)).toBe('5: item5');
      expect(Helper.getRow(viewport, 5)).toBe('6: item6');
      expect(scope.adapter.bufferLength).toBe(5);
    };

    it('should be consistent on backward direction when bof without immutableTop', function () {
      var scrollSettings = getSettings();
      scrollSettings.startIndex = -3;
      scrollSettings.padding = 0.5;
      runTest(scrollSettings, function (viewport, scope) {
        shouldWorkWhenBOF(viewport, scope);
      });
    });
  });

});
