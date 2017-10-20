/*global describe, beforeEach, module, inject, it, expect, runTest */
describe('uiScroll main/max indicies', function() {
  'use strict';

  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  describe('user min and max indexes', function() {
    var viewportHeight = 120;
    var itemHeight = 20;
    var bufferSize = 3;
    var userMinIndex = -99; // for 100 items
    var userMaxIndex = 100;

    var scrollSettings = {
      datasource: 'myInfiniteDatasource',
      viewportHeight: viewportHeight,
      itemHeight: itemHeight,
      bufferSize: bufferSize
    };

    it('should calculate bottom padding element\'s height after user max index is set', function() {
      var setMaxIndex;
      inject(function(myInfiniteDatasource) {
        setMaxIndex = function() {
          myInfiniteDatasource.maxIndex = userMaxIndex;
        };
      });
      runTest(scrollSettings,
        function(viewport) {
          var bottomPaddingElement = angular.element(viewport.children()[viewport.children().length - 1]);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);

          setMaxIndex();

          var virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(bottomPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);
        }
      );
    });

    it('should calculate top padding element\'s height after user min index is set', function() {
      var setMinIndex;
      inject(function(myInfiniteDatasource) {
        setMinIndex = function() {
          myInfiniteDatasource.minIndex = userMinIndex;
        };
      });
      runTest(scrollSettings,
        function(viewport) {
          var topPaddingElement = angular.element(viewport.children()[0]);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);

          setMinIndex();

          var virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(topPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * ((-1) * userMinIndex + 1));
        }
      );
    });

    it('should work with maxIndex pre-set on datasource', function() {
      inject(function(myInfiniteDatasource) {
        myInfiniteDatasource.maxIndex = userMaxIndex;
      });
      runTest(scrollSettings,
        function(viewport) {
          var bottomPaddingElement = angular.element(viewport.children()[viewport.children().length - 1]);
          var virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(bottomPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * bufferSize);
        }
      );
    });

    it('should work with minIndex pre-set on datasource', function() {
      inject(function(myInfiniteDatasource) {
        myInfiniteDatasource.minIndex = userMinIndex;
      });
      runTest(scrollSettings,
        function(viewport) {
          var topPaddingElement = angular.element(viewport.children()[0]);
          var virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(topPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
          expect(viewport.scrollTop()).toBe(itemHeight * ((-1) * userMinIndex + 1));
        }
      );
    });

  });

});