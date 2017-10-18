/*global describe, beforeEach, module, inject, it, expect, runTest */
describe('uiScroll main/max indicies', function() {
  'use strict';

  beforeEach(module('ui.scroll'));
  beforeEach(module('ui.scroll.test.datasources'));

  describe('user min and max indexes', function() {
    var viewportHeight = 120;
    var itemHeight = 20;
    var bufferSize = 3;
    var userMinIndex = -100;
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

          setMaxIndex();

          var virtualItemsAmount = userMaxIndex - (viewportHeight / itemHeight) - bufferSize;
          expect(bottomPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
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

          setMinIndex();

          var virtualItemsAmount = (-1) * userMinIndex - bufferSize + 1;
          expect(topPaddingElement.height()).toBe(itemHeight * virtualItemsAmount);
        }
      );
    });

  });

});