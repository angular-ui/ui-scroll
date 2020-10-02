describe('uiScroll visibility.', () => {
  'use strict';

  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  const scrollSettings = {
    datasource: 'myMultipageDatasource',
    viewportHeight: 200,
    itemHeight: 40,
    bufferSize: 3,
    adapter: 'adapter'
  };

  const checkContent = (rows, count) => {
    expect(rows.length).toBe(count);
    for (var i = 1; i < count - 1; i++) {
      expect(rows[i].innerHTML).toBe(i + ': item' + i);
    }
  };

  const onePackItemsCount = 3 * 1 + 2;
  const twoPacksItemsCount = 3 * 2 + 2;
  const threePacksItemsCount = 3 * 3 + 2;

  describe('Viewport visibility changing\n', () => {

    it('should create 9 divs with data (+ 2 padding divs)', () =>
      runTest(scrollSettings,
        (viewport) => {
          expect(viewport.scrollTop()).toBe(0);
          checkContent(viewport.children(), threePacksItemsCount);
        }
      )
    );

    it('should preserve elements after visibility switched off (display:none)', () =>
      runTest(scrollSettings,
        (viewport, scope) => {
          viewport.css('display', 'none');
          scope.$apply();

          expect(viewport.scrollTop()).toBe(0);
          checkContent(viewport.children(), threePacksItemsCount);
        }
      )
    );

    it('should only load one batch with visibility switched off (display:none)', () =>
      runTest(scrollSettings,
        (viewport, scope) => {
          viewport.css('display', 'none');
          scope.adapter.reload();

          expect(viewport.scrollTop()).toBe(0);
          checkContent(viewport.children(), onePackItemsCount);
        }
      )
    );

    it('should load full set after css-visibility switched back on', () =>
      runTest(scrollSettings,
        (viewport, scope, $timeout) => {
          viewport.css('display', 'none');
          scope.adapter.reload();

          viewport.css('display', 'block');
          scope.$apply();
          $timeout.flush();

          expect(viewport.scrollTop()).toBe(0);
          checkContent(viewport.children(), threePacksItemsCount);
          expect(scope.adapter.topVisible).toBe('item1');
        }
      )
    );

    it('should load full set after scope-visibility switched back on', () =>
      runTest(Object.assign({}, scrollSettings, {
          wrapper: {
            start: '<div ng-if="show">',
            end: '</div>'
          }
        }), (viewport, scope) => {
          scope.show = false;
          scope.$apply();
          expect(viewport.children().length).toBe(0);

          scope.show = true;
          scope.$apply();
          expect(viewport.scrollTop()).toBe(0);
          checkContent(viewport.children().children(), threePacksItemsCount);
        }, {
          scope: {
            show: true
          }
        }
      )
    );
  });

  describe('Items visibility changing\n', () => {

    it('should load only one batch with items height = 0', () =>
      runTest(Object.assign({}, scrollSettings, { itemHeight: '0' }),
        (viewport) => {
          expect(viewport.children().length).toBe(onePackItemsCount);
          expect(viewport.scrollTop()).toBe(0);
          checkContent(viewport.children(), onePackItemsCount);
        }
      )
    );

    it('should load one more batch after the height of some item is set to a positive value', () =>
      runTest(Object.assign({}, scrollSettings, { itemHeight: '0' }),
        (viewport, scope, $timeout) => {
          angular.element(viewport.children()[onePackItemsCount - 2]).css('height', 40);
          expect(angular.element(viewport.children()[onePackItemsCount - 2]).css('height')).toBe('40px');
          scope.$apply();
          $timeout.flush();

          expect(viewport.scrollTop()).toBe(0);
          checkContent(viewport.children(), twoPacksItemsCount);
        }
      )
    );
  });

});
