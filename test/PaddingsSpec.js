/*global describe, beforeEach, module, it, expect, runTest */
describe('uiScroll Paddings spec.', () => {
  'use strict';

  let datasource;
  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));
  beforeEach(
    inject(function(myResponsiveDatasource) {
      datasource = myResponsiveDatasource;
    })
  );

  const itemsCount = 30;
  const itemHeight = 100;
  const viewportHeight = 500;
  const MAX = 3; // maximum scrolling interations to reach out the EOF/BOF

  const scrollSettings = {
    datasource: 'myResponsiveDatasource',
    adapter: 'adapter',
    itemHeight: itemHeight,
    viewportHeight: viewportHeight
  };

  function appendTitle(outside, indicies) {
    return (outside ? ' outside' : ' inside') + ' the buffer' + (indicies ? ' when min/max indicies are set': '');
  }

  function setUserIndicies() {
    datasource.minIndex = datasource.min;
    datasource.maxIndex = datasource.max;
  }

  function getBottomPaddingHeight(viewport) {
    const viewportChildren = viewport.children();
    const bottomPadding = viewportChildren[viewportChildren.length - 1];
    return parseInt(angular.element(bottomPadding).css('height'), 10);
  }

  function getTopPaddingHeight(viewport) {
    const viewportChildren = viewport.children();
    const topPadding = viewportChildren[0];
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
      const indexRemoved = datasource.data.indexOf(datasource.data[index - datasource.min]);
      if(indexRemoved > -1) {
        datasource.data.splice(indexRemoved, 1);
        if(index === datasource.min) {
          datasource.min++;
        }
        else {
          datasource.max--;
        } 
      }
    }
  }

  function insertItems(datasource, index, items = []) {
    if(index >= datasource.min && index <= datasource.max && items.length) {
      const indexToInsert = datasource.data.indexOf(datasource.data[index - datasource.min]);
      if(indexToInsert > -1) {
        datasource.data.splice(indexToInsert, 0, items);
        datasource.max += items.length;
      }
    }
  }

  function checkRow(viewport, row, content, tail = false) {
    var children = viewport.children();
    if(tail) {
      row = children.length - 1 - row;
    }
    const rowElement = children[row];
    expect(rowElement.innerHTML).toBe(content);
  }

  it('\nshould set up properly', () => {
    runTest(scrollSettings,
      () => {
        expect(datasource.min).toBe(1);
        expect(datasource.max).toBe(itemsCount);
      }
    );
  });

  describe('Removing items via indexed-based applyUpdates\n', () => {

    [true, false].forEach(outside =>
      [true, false].forEach(userIndicies =>
        it('should remove last row' + appendTitle(outside, userIndicies), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndicies && setUserIndicies();

              scrollBottom(viewport, MAX);
              outside && scrollTop(viewport);
              const initialBottomHeight = getBottomPaddingHeight(viewport);

              removeItem(datasource, datasource.max);
              scope.adapter.applyUpdates(itemsCount, []);
              outside && expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight - itemHeight);

              !outside && scrollTop(viewport);
              scrollBottom(viewport, MAX);
              expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight);
              checkRow(viewport, 1, (itemsCount - 1) + ': item' + (itemsCount - 1), true);
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndicies =>
        it('should remove last row and then the next after last' + appendTitle(outside, userIndicies), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndicies && setUserIndicies();

              scrollBottom(viewport, MAX);
              outside && scrollTop(viewport);

              const initialBottomHeight = getBottomPaddingHeight(viewport);
              removeItem(datasource, datasource.max);
              scope.adapter.applyUpdates(itemsCount, []);
              removeItem(datasource, datasource.max);
              scope.adapter.applyUpdates(itemsCount - 1, []);
              outside && expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight - itemHeight * 2);

              !outside && scrollTop(viewport);
              scrollBottom(viewport, MAX);
              expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight * 2);
              checkRow(viewport, 1, (itemsCount - 2) + ': item' + (itemsCount - 2), true);
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndicies =>
        it('should remove pre-last row' + appendTitle(outside, userIndicies), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndicies && setUserIndicies();

              scrollBottom(viewport, MAX);
              outside && scrollTop(viewport);

              const initialBottomHeight = getBottomPaddingHeight(viewport);
              removeItem(datasource, datasource.max - 1);
              scope.adapter.applyUpdates(itemsCount - 1, []);
              outside && expect(getBottomPaddingHeight(viewport)).toBe(initialBottomHeight - itemHeight);

              !outside && scrollTop(viewport);
              scrollBottom(viewport, MAX);
              expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight);
              checkRow(viewport, 1, (itemsCount - 1) + ': item' + itemsCount, true);
              checkRow(viewport, 2, (itemsCount - 2) + ': item' + (itemsCount - 2), true);
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndicies =>
        it('should remove first row' + appendTitle(outside, userIndicies), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndicies && setUserIndicies();

              outside && scrollBottom(viewport, MAX);

              const initialTopHeight = getTopPaddingHeight(viewport);
              removeItem(datasource, datasource.min);
              scope.adapter.applyUpdates(1, []);
              outside && expect(getTopPaddingHeight(viewport)).toBe(initialTopHeight - itemHeight);

              !outside && scrollBottom(viewport, MAX);
              expect(getBottomPaddingHeight(viewport)).toBe(0);

              scrollTop(viewport);
              expect(getTopPaddingHeight(viewport)).toBe(0);
              checkRow(viewport, 1, '2: item2');
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndicies =>
        it('should remove first row and then the next after first' + appendTitle(outside, userIndicies), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndicies && setUserIndicies();

              outside && scrollBottom(viewport, MAX);

              const initialTopHeight = getTopPaddingHeight(viewport);
              removeItem(datasource, datasource.min);
              scope.adapter.applyUpdates(1, []);
              removeItem(datasource, datasource.min);
              scope.adapter.applyUpdates(2, []);
              outside && expect(getTopPaddingHeight(viewport)).toBe(initialTopHeight - itemHeight * 2);

              !outside && scrollBottom(viewport, MAX);
              expect(getBottomPaddingHeight(viewport)).toBe(0);

              scrollTop(viewport);
              expect(getTopPaddingHeight(viewport)).toBe(0);
              checkRow(viewport, 1, '3: item3');
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndicies =>
        it('should remove second row' + appendTitle(outside, userIndicies), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndicies && setUserIndicies();

              outside && scrollBottom(viewport, MAX);

              const initialTopHeight = getTopPaddingHeight(viewport);
              removeItem(datasource, datasource.min  + 1);
              scope.adapter.applyUpdates(2, []);
              outside && expect(getTopPaddingHeight(viewport)).toBe(initialTopHeight - itemHeight * 1);

              !outside && scrollBottom(viewport, MAX);
              //expect(getBottomPaddingHeight(viewport)).toBe(0); // todo dhilt : needs to be fixed

              scrollTop(viewport);
              expect(getTopPaddingHeight(viewport)).toBe(0);
              checkRow(viewport, 1, '1: item1');
              checkRow(viewport, 2, '2: item3');
            }
          )
        )
      )
    );
  });

  describe('Appending inside the buffer\n', () => {

    it('should append 3 rows via index-based applyUpdates', () => {
      runTest(Object.assign({}, scrollSettings, { startIndex: 28 }),
        (viewport, scope) => {
          const newItems = [
            'item' + (datasource.max + 1),
            'item' + (datasource.max + 2),
            'item' + (datasource.max + 3)
          ];
          const oldMax = datasource.max;
          const _scrollTop = viewport.scrollTop();

          insertItems(datasource, datasource.max, newItems);
          scope.adapter.applyUpdates(oldMax, ['item' + oldMax, ...newItems]);

          scrollBottom(viewport);
          expect(viewport.scrollTop()).toBe(_scrollTop + newItems.length * itemHeight);

          checkRow(viewport, 1, (datasource.max - 0) + ': ' + newItems[2], true);
          checkRow(viewport, 2, (datasource.max - 1) + ': ' + newItems[1], true);
          checkRow(viewport, 3, (datasource.max - 2) + ': ' + newItems[0], true);
          checkRow(viewport, 4, oldMax + ': item' + oldMax, true);
        }
      );
    });

    it('should append 3 rows via index-based applyUpdates when min/max indicies are set', () => {
      runTest(Object.assign({}, scrollSettings, { startIndex: 28 }),
        (viewport, scope) => {
          const newItems = [
            'item' + (datasource.max + 1),
            'item' + (datasource.max + 2),
            'item' + (datasource.max + 3)
          ];
          const oldMax = datasource.max;

          datasource.minIndex = datasource.min;
          datasource.maxIndex = datasource.max;
          const _scrollTop = viewport.scrollTop();

          insertItems(datasource, datasource.max, newItems);
          scope.adapter.applyUpdates(oldMax, ['item' + oldMax, ...newItems]);

          scrollBottom(viewport);
          expect(viewport.scrollTop()).toBe(_scrollTop + newItems.length * itemHeight);

          checkRow(viewport, 1, (datasource.max - 0) + ': ' + newItems[2], true);
          checkRow(viewport, 2, (datasource.max - 1) + ': ' + newItems[1], true);
          checkRow(viewport, 3, (datasource.max - 2) + ': ' + newItems[0], true);
          checkRow(viewport, 4, oldMax + ': item' + oldMax, true);
        }
      );
    });
  });

});