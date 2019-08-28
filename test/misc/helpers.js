

let Helper;

(function() {
  'use strict';

  Helper = {

    getTopPadding: (viewport) => {
      const viewportChildren = viewport.children();
      const topPadding = viewportChildren[0];
      return parseInt(topPadding.style.height, 10);
    },

    getBottomPadding: (viewport) => {
      const viewportChildren = viewport.children();
      const bottomPadding = viewportChildren[viewportChildren.length - 1];
      return parseInt(bottomPadding.style.height, 10);
    },

    getRow: (viewport, number) => { // number is index + 1
      const viewportChildren = viewport.children();
      if (viewportChildren.length < 2 + number) {
        return;
      }
      return viewportChildren[number].innerHTML;
    },

    getFirstRow: (viewport) => Helper.getRow(viewport, 1),

    getLastRow: (viewport) => {
      const viewportChildren = viewport.children();
      if (viewportChildren.length < 3) {
        return;
      }
      return viewportChildren[viewportChildren.length - 2].innerHTML;
    }

  };

})();
