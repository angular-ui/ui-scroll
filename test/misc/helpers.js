

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
    }

  };

})();
