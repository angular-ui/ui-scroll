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

  describe('applyUpdates tests\n', function () {
    injectDatasource('myOnePageDatasource');
    var scrollSettings = {datasource: 'myOnePageDatasource', adapter: 'adapter'};

    it('should create adapter object', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(viewport.children().length).toBe(5);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should update rows in place', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function(item, scope){
              return [item + ' *' + scope.$index];
            }
          );

          expect(viewport.children().length).toBe(5);
          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one *1');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two *2');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three *3');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three *3');
        }
      );
    });

    it('should update selected (first) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item, scope) {
              if (item === 'one') {
                return [item + ' *' + scope.$index];
              }
            }
          );

          expect(viewport.children().length).toBe(5);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one *1');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should update selected (middle) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item, scope) {
              if (item === 'two') {
                return [item + ' *' + scope.$index];
              }
            }
          );

          expect(viewport.children().length).toBe(5);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two *2');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should update selected (last) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item, scope) {
              if (item === 'three') {
                return [item + ' *' + scope.$index];
              }
            }
          );

          expect(viewport.children().length).toBe(5);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three *3');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three *3');
        }
      );
    });

    it('should delete selected (first) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item) {
              if (item === 'one') {
                return [];
              }
            }
          );

          expect(viewport.children().length).toBe(4);

          var row2 = viewport.children()[1];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[2];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('2: two');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should delete selected (first) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          datasource;

          scope.adapter.applyUpdates(
            function (item) {
              if (item === 'one') {
                return [];
              }
            },
            { immutableTop: true }
          );

          expect(viewport.children().length).toBe(4);

          var row2 = viewport.children()[1];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('1: two');

          var row3 = viewport.children()[2];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('2: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: two');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('2: three');
        }
      );
    });

    var deleteMiddleRow = function (viewport, scope, options) {

      scope.adapter.applyUpdates(
        function (item) {
          if (item === 'two') {
            return [];
          }
        },
        options
      );

      expect(viewport.children().length).toBe(4);

      var row1 = viewport.children()[1];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('1: one');

      var row2 = viewport.children()[2];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('2: three');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('2: three');
    };

    it('should delete selected (middle) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          deleteMiddleRow(viewport, scope);
        }
      );
    });

    it('should delete selected (middle) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          deleteMiddleRow(viewport, scope, { immutableTop: true });
        }
      );
    });

    var deleteLastRow = function (viewport, scope, options) {
      scope.adapter.applyUpdates(
        function (item) {
          if (item === 'three') {
            return [];
          }
        },
        options
      );

      expect(viewport.children().length).toBe(4);

      var row1 = viewport.children()[1];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('1: one');

      var row2 = viewport.children()[2];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('2: two');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('2: two');
    };

    it('should delete selected (last) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          deleteLastRow(viewport, scope);
        }
      );
    });

    it('should delete selected (last) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          deleteLastRow(viewport, scope, { immutableTop: true });
        }
      );
    });

    it('should insert a new element before selected (first) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item) {
              if (item === 'one') {
                return ['before one', item];
              }
            }
          );

          expect(viewport.children().length).toBe(6);

          var row0 = viewport.children()[1];
          expect(row0.tagName.toLowerCase()).toBe('div');
          expect(row0.innerHTML).toBe('0: before one');

          var row1 = viewport.children()[2];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[3];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[4];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('0: before one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should insert a new element before selected (first) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item) {
              if (item === 'one') {
                return ['before one', item];
              }
            },
            { immutableTop: true }
          );

          expect(viewport.children().length).toBe(6);

          var row0 = viewport.children()[1];
          expect(row0.tagName.toLowerCase()).toBe('div');
          expect(row0.innerHTML).toBe('1: before one');

          var row1 = viewport.children()[2];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('2: one');

          var row2 = viewport.children()[3];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('3: two');

          var row3 = viewport.children()[4];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('4: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: before one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('4: three');
        }
      );
    });

    var insertAfterFirst = function (viewport, scope, options) {
      scope.adapter.applyUpdates(
        function (item) {
          if (item.text === 'one') {
            return [item, { text: 'after one' }];
          }
        },
        options
      );

      expect(viewport.children().length).toBe(6);

      var row0 = viewport.children()[1];
      expect(row0.tagName.toLowerCase()).toBe('div');
      expect(row0.innerHTML).toBe('1: one');

      var row1 = viewport.children()[2];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('2: after one');

      var row2 = viewport.children()[3];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('3: two');

      var row3 = viewport.children()[4];
      expect(row3.tagName.toLowerCase()).toBe('div');
      expect(row3.innerHTML).toBe('4: three');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('4: three');
    };

    it('should insert a new element after selected (first) row', function () {
      var scrollSettings = { datasource: 'myObjectDatasource', adapter: 'adapter', template: '{{$index}}: {{item.text}}' };
      runTest(scrollSettings,
        function (viewport, scope) {
          insertAfterFirst(viewport, scope);
        }
      );
    });

    it('should insert a new element after selected (first) row with immutableTop option', function () {
      var scrollSettings = { datasource: 'myObjectDatasource', adapter: 'adapter', template: '{{$index}}: {{item.text}}' };
      runTest(scrollSettings,
        function (viewport, scope) {
          insertAfterFirst(viewport, scope, { immutableTop: true });
        }
      );
    });

    var insertBeforeSecond = function (viewport, scope, options) {
      scope.adapter.applyUpdates(
        function (item) {
          if (item === 'two') {
            return ['before two', item];
          }
        },
        options
      );

      expect(viewport.children().length).toBe(6);

      var row0 = viewport.children()[1];
      expect(row0.tagName.toLowerCase()).toBe('div');
      expect(row0.innerHTML).toBe('1: one');

      var row1 = viewport.children()[2];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('2: before two');

      var row2 = viewport.children()[3];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('3: two');

      var row3 = viewport.children()[4];
      expect(row3.tagName.toLowerCase()).toBe('div');
      expect(row3.innerHTML).toBe('4: three');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('4: three');
    };

    it('should insert a new element before selected (middle) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insertBeforeSecond(viewport, scope);
        }
      );
    });

    it('should insert a new element before selected (middle) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insertBeforeSecond(viewport, scope, { immutableTop: true });
        }
      );
    });

    var insertAfterLast = function (viewport, scope, options) {
      scope.adapter.applyUpdates(
        function (item) {
          if (item === 'three') {
            return [item, 'after three'];
          }
        },
        options
      );

      expect(viewport.children().length).toBe(6);

      var row0 = viewport.children()[1];
      expect(row0.tagName.toLowerCase()).toBe('div');
      expect(row0.innerHTML).toBe('1: one');

      var row1 = viewport.children()[2];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('2: two');

      var row2 = viewport.children()[3];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('3: three');

      var row3 = viewport.children()[4];
      expect(row3.tagName.toLowerCase()).toBe('div');
      expect(row3.innerHTML).toBe('4: after three');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('4: after three');
    };

    it('should insert a new element after selected (last) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insertAfterLast(viewport, scope);
        }
      );
    });

    it('should insert a new element after selected (last) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insertAfterLast(viewport, scope, { immutableTop: true });
        }
      );
    });
  });

  describe('applyUpdates tests (index based)\n', function () {
    var scrollSettings = {datasource: 'myOnePageDatasource', adapter: 'adapter'};

    it('should update selected (first) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(1, ['one *1']);

          expect(viewport.children().length).toBe(5);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one *1');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should ignore out of bound indexes', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(0, ['invalid']);

          expect(viewport.children().length).toBe(5);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should ignore out of bound indexes 2', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(4, ['invalid']);

          expect(viewport.children().length).toBe(5);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should update selected (middle) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(2, ['two *2']);

          expect(viewport.children().length).toBe(5);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two *2');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should update selected (last) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(3, ['three *3']);

          expect(viewport.children().length).toBe(5);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three *3');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three *3');
        }
      );
    });

    it('should delete selected (first) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(1, []);

          expect(viewport.children().length).toBe(4);

          var row2 = viewport.children()[1];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[2];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('2: two');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should delete selected (first) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          expect(viewport.children().length).toBe(5);

          scope.adapter.applyUpdates(1, [], { immutableTop: true });

          expect(viewport.children().length).toBe(4);

          var row2 = viewport.children()[1];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('1: two');

          var row3 = viewport.children()[2];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('2: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: two');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('2: three');
        }
      );
    });

    var deleteMiddleRow = function (viewport, scope, options) {
      scope.adapter.applyUpdates(2, [], options);

      expect(viewport.children().length).toBe(4);

      var row1 = viewport.children()[1];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('1: one');

      var row2 = viewport.children()[2];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('2: three');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('2: three');
    };

    it('should delete selected (middle) row', function () {
      runTest(scrollSettings, function (viewport, scope) {
        deleteMiddleRow(viewport, scope);
      });
    });

    it('should delete selected (middle) row with immutableTop option', function () {
      runTest(scrollSettings, function (viewport, scope) {
        deleteMiddleRow(viewport, scope, { immutableTop: true });
      });
    });

    var deleteLastRow = function (viewport, scope) {
      scope.adapter.applyUpdates(3, []);

      expect(viewport.children().length).toBe(4);

      var row1 = viewport.children()[1];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('1: one');

      var row2 = viewport.children()[2];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('2: two');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('2: two');
    };

    it('should delete selected (last) row', function () {
      runTest(scrollSettings, function (viewport, scope) {
        deleteLastRow(viewport, scope);
      });
    });

    it('should delete selected (last) row with immutableTop option', function () {
      runTest(scrollSettings, function (viewport, scope) {
        deleteLastRow(viewport, scope, { immutableTop: true });
      });
    });

    it('should insert a new element before selected (first) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(1, ['before one', 'one']);

          expect(viewport.children().length).toBe(6);

          var row0 = viewport.children()[1];
          expect(row0.tagName.toLowerCase()).toBe('div');
          expect(row0.innerHTML).toBe('0: before one');

          var row1 = viewport.children()[2];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[3];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[4];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('0: before one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should insert a new element before selected (first) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          expect(viewport.children().length).toBe(5);

          scope.adapter.applyUpdates(1, ['before one', 'one'], { immutableTop: true });

          expect(viewport.children().length).toBe(6);

          var row0 = viewport.children()[1];
          expect(row0.tagName.toLowerCase()).toBe('div');
          expect(row0.innerHTML).toBe('1: before one');

          var row1 = viewport.children()[2];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('2: one');

          var row2 = viewport.children()[3];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('3: two');

          var row3 = viewport.children()[4];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('4: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: before one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('4: three');
        }
      );
    });

    var insertAfterFirst = function (viewport, scope, options) {
      scope.adapter.applyUpdates(1, ['one', 'after one'], options);

      expect(viewport.children().length).toBe(6);

      var row0 = viewport.children()[1];
      expect(row0.tagName.toLowerCase()).toBe('div');
      expect(row0.innerHTML).toBe('1: one');

      var row1 = viewport.children()[2];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('2: after one');

      var row2 = viewport.children()[3];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('3: two');

      var row3 = viewport.children()[4];
      expect(row3.tagName.toLowerCase()).toBe('div');
      expect(row3.innerHTML).toBe('4: three');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('4: three');
    };

    it('should insert a new element after selected (first) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insertAfterFirst(viewport, scope);
        }
      );
    });

    it('should insert a new element after selected (first) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insertAfterFirst(viewport, scope, { immutableTop: true });
        }
      );
    });

    var insertBeforeSecond = function (viewport, scope, options) {
      scope.adapter.applyUpdates(2, ['before two', 'two'], options);

      expect(viewport.children().length).toBe(6);

      var row0 = viewport.children()[1];
      expect(row0.tagName.toLowerCase()).toBe('div');
      expect(row0.innerHTML).toBe('1: one');

      var row1 = viewport.children()[2];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('2: before two');

      var row2 = viewport.children()[3];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('3: two');

      var row3 = viewport.children()[4];
      expect(row3.tagName.toLowerCase()).toBe('div');
      expect(row3.innerHTML).toBe('4: three');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('4: three');
    };

    it('should insert a new element before selected (middle) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insertBeforeSecond(viewport, scope);
        }
      );
    });

    it('should insert a new element before selected (middle) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insertBeforeSecond(viewport, scope, { immutableTop: true });
        }
      );
    });

    var insretAfterLast = function (viewport, scope, options) {
      scope.adapter.applyUpdates(3, ['three', 'after three'], options);

      expect(viewport.children().length).toBe(6);

      var row0 = viewport.children()[1];
      expect(row0.tagName.toLowerCase()).toBe('div');
      expect(row0.innerHTML).toBe('1: one');

      var row1 = viewport.children()[2];
      expect(row1.tagName.toLowerCase()).toBe('div');
      expect(row1.innerHTML).toBe('2: two');

      var row2 = viewport.children()[3];
      expect(row2.tagName.toLowerCase()).toBe('div');
      expect(row2.innerHTML).toBe('3: three');

      var row3 = viewport.children()[4];
      expect(row3.tagName.toLowerCase()).toBe('div');
      expect(row3.innerHTML).toBe('4: after three');

      expect(scope.adapter).toBeTruthy();
      expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
      expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('4: after three');
    };

    it('should insert a new element after selected (last) row', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insretAfterLast(viewport, scope);
        }
      );
    });

    it('should insert a new element after selected (last) row with immutableTop option', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          insretAfterLast(viewport, scope, { immutableTop: true });
        }
      );
    });
  });

  describe('applyUpdates tests with object items\n', function () {
    var scrollSettings = {
      datasource: 'myObjectDatasource',
      adapter: 'adapter',
      template: '{{$index}}: {{item.text}}'
    };

    it('should update existing item inplace', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item, scope) {
              item.text += ' *' + scope.$index;
            }
          );

          expect(viewport.children().length).toBe(5);
          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one *1');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two *2');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three *3');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three *3');
        }
      );
    });

    it('should replace existing item with an updated one', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item, scope) {
              return [
                {
                  text: item.text + ' *' + scope.$index
                }
              ];
            }
          );

          expect(viewport.children().length).toBe(5);
          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one *1');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two *2');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three *3');


          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one *1');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three *3');
        }
      );
    });

    it('should preserve the order of inserted items', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item, scope) {
              if (scope.$index === 1) {
                item.text += ' *' + scope.$index;
                return [
                  {text: item.text + ' before 1'},
                  {text: item.text + ' before 2'},
                  item,
                  {text: item.text + ' after 1'},
                  {text: item.text + ' after 2'}
                ];
              }
            }
          );

          expect(viewport.children().length).toBe(9);
          var row1, row2, row3;

          row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('-1: one *1 before 1');

          row1 = viewport.children()[2];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('0: one *1 before 2');

          row1 = viewport.children()[3];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one *1');

          row1 = viewport.children()[4];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('2: one *1 after 1');

          row1 = viewport.children()[5];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('3: one *1 after 2');

          row2 = viewport.children()[6];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('4: two');

          row3 = viewport.children()[7];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('5: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('-1: one *1 before 1');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('5: three');
        }
      );
    });

    it('should preserve the order of inserted items 2', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.applyUpdates(
            function (item, scope) {
              if (scope.$index === 2) {
                item.text += ' *' + scope.$index;
                return [
                  {text: item.text + ' before 1'},
                  {text: item.text + ' before 2'},
                  item,
                  {text: item.text + ' after 1'},
                  {text: item.text + ' after 2'}
                ];
              }
            }
          );

          expect(viewport.children().length).toBe(9);
          var row1, row2, row3;

          row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          row1 = viewport.children()[2];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('2: two *2 before 1');

          row1 = viewport.children()[3];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('3: two *2 before 2');

          row2 = viewport.children()[4];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('4: two *2');

          row1 = viewport.children()[5];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('5: two *2 after 1');

          row1 = viewport.children()[6];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('6: two *2 after 2');

          row3 = viewport.children()[7];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('7: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('7: three');
        }
      );
    });
  });

  describe('append tests\n', function () {

    it('should append two rows to the dataset', function () {
      runTest({datasource: 'myOnePageDatasource', adapter: 'adapter'},
        function (viewport, scope) {

          scope.adapter.append(['appended one', 'appended two']);

          expect(viewport.children().length).toBe(7);

          var row1 = viewport.children()[1];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[2];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[3];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          var row4 = viewport.children()[4];
          expect(row4.tagName.toLowerCase()).toBe('div');
          expect(row4.innerHTML).toBe('4: appended one');

          var row5 = viewport.children()[5];
          expect(row5.tagName.toLowerCase()).toBe('div');
          expect(row5.innerHTML).toBe('5: appended two');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('5: appended two');
        }
      );
    });

    it('should append two rows to the empty dataset', function () {
      runTest({datasource: 'myEmptyDatasource', adapter: 'adapter'},
        function (viewport, scope) {

          scope.adapter.append(['appended one', 'appended two']);

          expect(viewport.children().length).toBe(4);

          var row4 = viewport.children()[1];
          expect(row4.tagName.toLowerCase()).toBe('div');
          expect(row4.innerHTML).toBe('1: appended one');

          var row5 = viewport.children()[2];
          expect(row5.tagName.toLowerCase()).toBe('div');
          expect(row5.innerHTML).toBe('2: appended two');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: appended one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('2: appended two');
        }
      );
    });

  });

  describe('prepend tests\n', function () {

    it('should prepend two rows to the dataset', function () {
      runTest({ datasource: 'myOnePageDatasource', adapter: 'adapter' },
        function (viewport, scope) {

          scope.adapter.prepend(['prepended one', 'prepended two']);

          expect(viewport.children().length).toBe(7);

          var row4 = viewport.children()[1];
          expect(row4.tagName.toLowerCase()).toBe('div');
          expect(row4.innerHTML).toBe('-1: prepended one');

          var row5 = viewport.children()[2];
          expect(row5.tagName.toLowerCase()).toBe('div');
          expect(row5.innerHTML).toBe('0: prepended two');

          var row1 = viewport.children()[3];
          expect(row1.tagName.toLowerCase()).toBe('div');
          expect(row1.innerHTML).toBe('1: one');

          var row2 = viewport.children()[4];
          expect(row2.tagName.toLowerCase()).toBe('div');
          expect(row2.innerHTML).toBe('2: two');

          var row3 = viewport.children()[5];
          expect(row3.tagName.toLowerCase()).toBe('div');
          expect(row3.innerHTML).toBe('3: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('-1: prepended one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('3: three');
        }
      );
    });

    it('should prepend two rows to the dataset with immutableTop option', function () {
      runTest({ datasource: 'myOnePageDatasource', adapter: 'adapter' },
        function (viewport, scope) {

          scope.adapter.prepend(['prepended one', 'prepended two'], { immutableTop: true });

          expect(viewport.children().length).toBe(7);
          expect(viewport.children()[1].innerHTML).toBe('1: prepended one');
          expect(viewport.children()[2].innerHTML).toBe('2: prepended two');
          expect(viewport.children()[3].innerHTML).toBe('3: one');
          expect(viewport.children()[4].innerHTML).toBe('4: two');
          expect(viewport.children()[5].innerHTML).toBe('5: three');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: prepended one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('5: three');
        }
      );
    });

    it('should prepend two rows to the empty dataset', function () {
      runTest({ datasource: 'myEmptyDatasource', adapter: 'adapter' },
        function (viewport, scope) {

          scope.adapter.prepend(['prepended one', 'prepended two']);

          expect(viewport.children().length).toBe(4);

          var row4 = viewport.children()[1];
          expect(row4.tagName.toLowerCase()).toBe('div');
          expect(row4.innerHTML).toBe('-1: prepended one');

          var row5 = viewport.children()[2];
          expect(row5.tagName.toLowerCase()).toBe('div');
          expect(row5.innerHTML).toBe('0: prepended two');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('-1: prepended one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('0: prepended two');
        }
      );
    });

    it('should prepend two rows to the empty dataset with immutableTop option', function () {
      runTest({ datasource: 'myEmptyDatasource', adapter: 'adapter' },
        function (viewport, scope) {

          scope.adapter.prepend(['prepended one', 'prepended two'], { immutableTop: true });

          expect(viewport.children().length).toBe(4);
          expect(viewport.children()[1].innerHTML).toBe('1: prepended one');
          expect(viewport.children()[2].innerHTML).toBe('2: prepended two');

          expect(scope.adapter).toBeTruthy();
          expect(scope.adapter.topVisibleElement[0].innerHTML).toBe('1: prepended one');
          expect(scope.adapter.bottomVisibleElement[0].innerHTML).toBe('2: prepended two');
        }
      );
    });

  });

  describe('adapter reload tests', function () {
    var scrollSettings = {datasource: 'myInfiniteDatasource', adapter: 'adapter'};

    it('initial load should be positioned at item#1', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.topVisible).toBe('item1');
        }
      );
    });

    it('reload(100) should position it at item#100', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.topVisible).toBe('item1');

          scope.adapter.reload(100);

          expect(scope.adapter.topVisible).toBe('item100');
        }
      );
    });

    it('reload() after reload(100) should position it at item#100', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.topVisible).toBe('item1');

          scope.adapter.reload(100);

          expect(scope.adapter.topVisible).toBe('item100');

          scope.adapter.reload();

          expect(scope.adapter.topVisible).toBe('item100');
        }
      );
    });

    it('reload(0) after reload(100) should position it at item#0', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.topVisible).toBe('item1');

          scope.adapter.reload(100);

          expect(scope.adapter.topVisible).toBe('item100');

          scope.adapter.reload(0);

          expect(scope.adapter.topVisible).toBe('item0');
        }
      );
    });

    it('should round numbers for startIndex', () => {
      runTest(scrollSettings,
        function (viewport, scope) {
          scope.adapter.reload(23.4);
          expect(scope.adapter.topVisible).toBe('item23');

          scope.adapter.reload(-56.9);
          expect(scope.adapter.topVisible).toBe('item-57');
        }
      );
    });

    it('should correctly convert string to number and round', () => {
      runTest(scrollSettings,
        function (viewport, scope) {
          scope.adapter.reload('1001.14');
          expect(scope.adapter.topVisible).toBe('item1001');

          scope.adapter.reload('0');
          expect(scope.adapter.topVisible).toBe('item0');
        }
      );
    });

    it('should set startIndex to default if number is invalid', () => {
      runTest(scrollSettings,
        function (viewport, scope) {
          scope.adapter.reload('invalid number');
          expect(scope.adapter.topVisible).toBe('item1');

          scope.adapter.reload({});
          expect(scope.adapter.topVisible).toBe('item1');

          scope.adapter.reload(null);
          expect(scope.adapter.topVisible).toBe('item1');
        }
      );
    });

  });

  describe('adapter bof/eof/empty', function () {

    it('empty dataset', function () {
      runTest({datasource: 'myEmptyDatasource', adapter: 'adapter'},
        function (viewport, scope) {
          expect(scope.adapter.isEmpty()).toBe(true);
          expect(scope.adapter.isBOF()).toBe(true);
          expect(scope.adapter.isEOF()).toBe(true);
        }
      );
    });

    it('one short page dataset', function () {
      runTest({datasource: 'myOnePageDatasource', adapter: 'adapter'},
        function (viewport, scope) {
          expect(scope.adapter.isEmpty()).toBe(false);
          expect(scope.adapter.isBOF()).toBe(true);
          expect(scope.adapter.isEOF()).toBe(true);
        }
      );
    });

    it('one big page dataset', function () {
      runTest({datasource: 'myOneBigPageDatasource', adapter: 'adapter'},
        function (viewport, scope) {
          expect(scope.adapter.isEmpty()).toBe(false);
          expect(scope.adapter.isBOF()).toBe(true);
          expect(scope.adapter.isEOF()).toBe(false);
        }
      );
    });

    it('one big page dataset after scroll down', function () {
      runTest({datasource: 'myOneBigPageDatasource', adapter: 'adapter'},
        function (viewport, scope) {

          expect(scope.adapter.isEmpty()).toBe(false);
          expect(scope.adapter.isBOF()).toBe(true);
          expect(scope.adapter.isEOF()).toBe(false);

          viewport.scrollTop(10000);

          expect(scope.adapter.isEOF()).toBe(true);
          expect(scope.adapter.bottomVisible).toBe('item99');
        }
      );
    });

  });

  describe('adapter bottomVisible', function () {
    var scrollSettings = {datasource: 'myMultipageDatasource', adapter: 'adapter', viewportHeight: 80, itemHeight: 20};

    it('scroll down a bit', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.bottomVisible).toBe('item4');

          viewport.scrollTop(10);
          expect(scope.adapter.bottomVisible).toBe('item5');

          viewport.scrollTop(20);
          expect(scope.adapter.bottomVisible).toBe('item5');

          viewport.scrollTop(30);
          expect(scope.adapter.bottomVisible).toBe('item6');
        }
      );
    });

    it('scroll down to the very bottom', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.bottomVisible).toBe('item4');

          viewport.scrollTop(1000);
          expect(scope.adapter.bottomVisible).toBe('item10');

          viewport.scrollTop(1000);
          expect(scope.adapter.bottomVisible).toBe('item20');
        }
      );
    });

  });

  describe('adapter append/prepend clipping', function () {
    var scrollSettings = {datasource: 'myOnePageDatasource', adapter: 'adapter', viewportHeight: 60, itemHeight: 20, bufferSize: 3, padding: 1};

    it('should not clip after 1 small pack appended', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.isEOF()).toBe(true);

          scope.adapter.append(['item1*', 'item2*', 'item3*']);
          expect(scope.adapter.isEOF()).toBe(true);
          expect(viewport.children().length).toBe(2 + 3 + 3);

          var lastRow = viewport.children()[viewport.children().length - 2];
          expect(lastRow.innerHTML).toBe('6: item3*');
        }
      );
    });

    it('should clip 1 bottom item from the 1 big pack appended', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.isEOF()).toBe(true);

          scope.adapter.append(['item1*', 'item2*', 'item3*', 'item4*']);
          expect(scope.adapter.isEOF()).toBe(false);

          viewport.scrollTop(10000);
          expect(scope.adapter.isEOF()).toBe(true);
          expect(viewport.children().length).toBe(2 + 3 + 3);

          var lastRow = viewport.children()[viewport.children().length - 2];
          expect(lastRow.innerHTML).toBe('6: item3*');
        }
      );
    });

    it('should clip 1 pack from top after 3 packs appended', function () {
      runTest(scrollSettings,
        function (viewport, scope) {

          scope.adapter.append(['item1*', 'item2*', 'item3*', 'item4*']);
          expect(viewport.children().length).toBe(2 + 3 + 3);

          viewport.scrollTop(3 * 20);
          scope.adapter.append(['item4*', 'item5*', 'item6*', 'item7*']);
          expect(viewport.children().length).toBe(2 + 3 + 3 + 3);

          viewport.scrollTop(3 * 20 * 2);
          scope.adapter.append(['item7*', 'item8*', 'item9*', 'item10*']);
          expect(viewport.children().length).toBe(2 + 3 + 3 + 3);

          var firstRow = viewport.children()[1];
          expect(firstRow.innerHTML).toBe('4: item1*');

          var lastRow = viewport.children()[viewport.children().length - 2];
          expect(lastRow.innerHTML).toBe('12: item9*');
        }
      );
    });

  });

  describe('adapter bufferFirst, bufferLast, bufferLength', function () {
    var scrollSettings = { datasource: 'myMultipageDatasource', adapter: 'adapter', viewportHeight: 80, itemHeight: 20 };

    it('without scroll', function () {
      runTest(scrollSettings,
        function (viewport, scope) {
          expect(scope.adapter.bufferFirst).toBe('item1');
          expect(scope.adapter.bufferLast).toBe('item10');
          expect(scope.adapter.bufferLength).toBe(10);
        }
      );
    });

    it('scroll to the bottom', function () {
      runTest(scrollSettings,
        function (viewport, scope) {          
          viewport.scrollTop(10000);
          expect(scope.adapter.bufferFirst).toBe('item5');
          expect(scope.adapter.bufferLast).toBe('item20');
          expect(scope.adapter.bufferLength).toBe(16);
        }
      );
    });

  });

});
