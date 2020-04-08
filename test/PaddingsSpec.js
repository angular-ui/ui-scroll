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

  function appendTitle(outside, indices) {
    return (outside ? ' outside' : ' inside') + ' the buffer' + (indices ? ' when min/max indices are set': '');
  }

  function setUserIndices() {
    datasource.minIndex = datasource.min;
    datasource.maxIndex = datasource.max;
  }

  function scrollBottom(viewport, count = 1) {
    for (var i = 0; i < count; i++) {
      viewport.scrollTop(99999);
    }
  }

  function scrollTop(viewport, count = 1) {
    for (var i = 0; i < count; i++) {
      viewport.scrollTop(0);
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

  function checkRowBack(viewport, row, content) {
    checkRow(viewport, row, content, true);
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
      [true, false].forEach(userIndices =>
        it('should remove last row' + appendTitle(outside, userIndices), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndices && setUserIndices();

              scrollBottom(viewport, MAX);
              outside && scrollTop(viewport);
              const initialBottomHeight = Helper.getBottomPadding(viewport);

              removeItem(datasource, datasource.max);
              scope.adapter.applyUpdates(itemsCount, []);
              outside && expect(Helper.getBottomPadding(viewport)).toBe(initialBottomHeight - itemHeight);

              !outside && scrollTop(viewport);
              scrollBottom(viewport, MAX);
              expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight);
              checkRowBack(viewport, 1, (itemsCount - 1) + ': item' + (itemsCount - 1));
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndices =>
        it('should remove last row and then the next after last' + appendTitle(outside, userIndices), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndices && setUserIndices();

              scrollBottom(viewport, MAX);
              outside && scrollTop(viewport);

              const initialBottomHeight = Helper.getBottomPadding(viewport);
              removeItem(datasource, datasource.max);
              scope.adapter.applyUpdates(itemsCount, []);
              removeItem(datasource, datasource.max);
              scope.adapter.applyUpdates(itemsCount - 1, []);
              outside && expect(Helper.getBottomPadding(viewport)).toBe(initialBottomHeight - itemHeight * 2);

              !outside && scrollTop(viewport);
              scrollBottom(viewport, MAX);
              expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight * 2);
              checkRowBack(viewport, 1, (itemsCount - 2) + ': item' + (itemsCount - 2));
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndices =>
        it('should remove pre-last row' + appendTitle(outside, userIndices), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndices && setUserIndices();

              scrollBottom(viewport, MAX);
              outside && scrollTop(viewport);

              const initialBottomHeight = Helper.getBottomPadding(viewport);
              removeItem(datasource, datasource.max - 1);
              scope.adapter.applyUpdates(itemsCount - 1, []);
              outside && expect(Helper.getBottomPadding(viewport)).toBe(initialBottomHeight - itemHeight);

              !outside && scrollTop(viewport);
              scrollBottom(viewport, MAX);
              expect(viewport.scrollTop()).toBe(itemsCount * itemHeight - viewportHeight - itemHeight);
              checkRowBack(viewport, 1, (itemsCount - 1) + ': item' + itemsCount);
              checkRowBack(viewport, 2, (itemsCount - 2) + ': item' + (itemsCount - 2));
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndices =>
        it('should remove first row' + appendTitle(outside, userIndices), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndices && setUserIndices();

              outside && scrollBottom(viewport, MAX);

              const initialTopHeight = Helper.getTopPadding(viewport);
              removeItem(datasource, datasource.min);
              scope.adapter.applyUpdates(1, []);
              outside && expect(Helper.getTopPadding(viewport)).toBe(initialTopHeight - itemHeight);

              !outside && scrollBottom(viewport, MAX);
              expect(Helper.getBottomPadding(viewport)).toBe(0);

              scrollTop(viewport);
              expect(Helper.getTopPadding(viewport)).toBe(0);
              checkRow(viewport, 1, '2: item2');
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndices =>
        it('should remove first row and then the next after first' + appendTitle(outside, userIndices), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndices && setUserIndices();

              outside && scrollBottom(viewport, MAX);

              const initialTopHeight = Helper.getTopPadding(viewport);
              removeItem(datasource, datasource.min);
              scope.adapter.applyUpdates(1, []);
              removeItem(datasource, datasource.min);
              scope.adapter.applyUpdates(2, []);
              outside && expect(Helper.getTopPadding(viewport)).toBe(initialTopHeight - itemHeight * 2);

              !outside && scrollBottom(viewport, MAX);
              expect(Helper.getBottomPadding(viewport)).toBe(0);

              scrollTop(viewport);
              expect(Helper.getTopPadding(viewport)).toBe(0);
              checkRow(viewport, 1, '3: item3');
            }
          )
        )
      )
    );

    [true, false].forEach(outside =>
      [true, false].forEach(userIndices =>
        it('should remove second row' + appendTitle(outside, userIndices), () =>
          runTest(scrollSettings,
            (viewport, scope) => {
              userIndices && setUserIndices();

              outside && scrollBottom(viewport, MAX);

              const initialTopHeight = Helper.getTopPadding(viewport);
              removeItem(datasource, datasource.min  + 1);
              scope.adapter.applyUpdates(2, []);
              outside && expect(Helper.getTopPadding(viewport)).toBe(initialTopHeight - itemHeight * 1);

              !outside && scrollBottom(viewport, MAX);
              expect(Helper.getBottomPadding(viewport)).toBe(0);

              scrollTop(viewport);
              expect(Helper.getTopPadding(viewport)).toBe(0);
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

          checkRowBack(viewport, 1, (datasource.max - 0) + ': ' + newItems[2]);
          checkRowBack(viewport, 2, (datasource.max - 1) + ': ' + newItems[1]);
          checkRowBack(viewport, 3, (datasource.max - 2) + ': ' + newItems[0]);
          checkRowBack(viewport, 4, oldMax + ': item' + oldMax);
        }
      );
    });

    it('should append 3 rows via index-based applyUpdates when min/max indices are set', () => {
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

          checkRowBack(viewport, 1, (datasource.max - 0) + ': ' + newItems[2]);
          checkRowBack(viewport, 2, (datasource.max - 1) + ': ' + newItems[1]);
          checkRowBack(viewport, 3, (datasource.max - 2) + ': ' + newItems[0]);
          checkRowBack(viewport, 4, oldMax + ': item' + oldMax);
        }
      );
    });
  });


  describe('Removing items via indexed-based applyUpdates when neither BOF nor EOF are reached\n', () => {
    const _scrollSettings = Object.assign({}, scrollSettings, { startIndex: 12 });

    [true, false].forEach(userIndices =>
      it('should remove first buffered row' + appendTitle(true, userIndices), () =>
        runTest(_scrollSettings,
          (viewport, scope) => {
            userIndices && setUserIndices();

            removeItem(datasource, 2);
            scope.adapter.applyUpdates(2, []);

            scrollBottom(viewport, MAX);
            expect(Helper.getBottomPadding(viewport)).toBe(0);
            checkRowBack(viewport, 1, (itemsCount - 1) + ': item' + itemsCount);

            scrollTop(viewport);
            expect(Helper.getTopPadding(viewport)).toBe(0);
            checkRow(viewport, 1, '1: item1');
            checkRow(viewport, 2, '2: item3');
          }
        )
      )
    );

    [true, false].forEach(userIndices =>
      it('should remove last buffered row' + appendTitle(true, userIndices), () =>
        runTest(_scrollSettings,
          (viewport, scope) => {
            userIndices && setUserIndices();

            removeItem(datasource, 19);
            scope.adapter.applyUpdates(19, []);

            scrollBottom(viewport);
            expect(Helper.getBottomPadding(viewport)).toBe(0);
            checkRowBack(viewport, 1, (itemsCount - 1) + ': item' + itemsCount);

            scrollTop(viewport);
            expect(Helper.getTopPadding(viewport)).toBe(0);
          }
        )
      )
    );

    [true, false].forEach(userIndices =>
      it('should remove absolute first row' + appendTitle(true, userIndices), () =>
        runTest(_scrollSettings,
          (viewport, scope) => {
            userIndices && setUserIndices();

            removeItem(datasource, 1);
            scope.adapter.applyUpdates(1, []);

            scrollBottom(viewport, MAX);
            expect(Helper.getBottomPadding(viewport)).toBe(0);
            checkRowBack(viewport, 1, itemsCount + ': item' + itemsCount);

            scrollTop(viewport);
            expect(Helper.getTopPadding(viewport)).toBe(0);
            checkRow(viewport, 1, '2: item2');
            checkRow(viewport, 2, '3: item3');
          }
        )
      )
    );

    [true, false].forEach(userIndices =>
      it('should remove absolute last row' + appendTitle(true, userIndices), () =>
        runTest(_scrollSettings,
          (viewport, scope) => {
            userIndices && setUserIndices();

            removeItem(datasource, itemsCount);
            scope.adapter.applyUpdates(itemsCount, []);

            scrollBottom(viewport, MAX);
            expect(Helper.getBottomPadding(viewport)).toBe(0);
            checkRowBack(viewport, 1, (itemsCount - 1) + ': item' + (itemsCount - 1));

            scrollTop(viewport);
            expect(Helper.getTopPadding(viewport)).toBe(0);
            checkRow(viewport, 1, '1: item1');
            checkRow(viewport, 2, '2: item2');
          }
        )
      )
    );
  });

});
