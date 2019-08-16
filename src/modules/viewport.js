import Padding from './padding';

export default function Viewport(elementRoutines, buffer, element, viewportController, $rootScope, padding, rowHeight) {
  let topPadding = null;
  let bottomPadding = null;
  const viewport = viewportController && viewportController.viewport ? viewportController.viewport : angular.element(window);
  const container = viewportController && viewportController.container ? viewportController.container : undefined;
  const scope = viewportController && viewportController.scope ? viewportController.scope : $rootScope;

  viewport.css({
    'overflow-anchor': 'none',
    'overflow-y': 'auto',
    'display': 'block'
  });

  function bufferPadding() {
    return viewport.outerHeight() * padding; // some extra space to initiate preload
  }

  // 
  //   Viewport measurements
  //
  //     +----------------+  0
  //     |      top       |
  //     |    padding     |
  //     +----------------+  topDataPos() [=topPadding.height]
  //     |   not visible  |
  //     |      items     |
  //     +----------------+  topVisiblePos() [=viewport.scrollTop]
  //     |                |
  //     |     visible    |
  //     |      items     |
  //     |                |
  //     +----------------+  bottomVisiblePos() [=viewport.scrollTop+viewport.height]
  //     |   not visible  |
  //     |      items     |
  //     +----------------+  bottomDataPos() [=scrollHeight-bottomPadding.height]
  //     |    bottom      |
  //     |    padding     |
  //     +----------------+  scrollHeight 
  //
  // bufferPadding is some extra space we have top & bottom to allow infinite scrolling
  //          bufferPadding = viewport.outerHeight() * padding
  //
  //  bottomVisiblePos() - topVisiblePos() == viewport.outerHeight()
  

  angular.extend(viewport, {
    getScope() {
      return scope;
    },

    createPaddingElements(template) {
      topPadding = new Padding(template,!rowHeight);
      bottomPadding = new Padding(template,!rowHeight);
      element.before(topPadding.element);
      element.after(bottomPadding.element);
      topPadding.height(0);
      bottomPadding.height(0);
    },

    applyContainerStyle() {
      if (!container) {
        return true;
      }
      if(container !== viewport) {
        viewport.css('height', window.getComputedStyle(container[0]).height);
      }
      return viewport.height() > 0;
    },

    bottomDataPos() {
      let scrollHeight = viewport[0].scrollHeight;
      scrollHeight = scrollHeight != null ? scrollHeight : viewport[0].document.documentElement.scrollHeight;
      return scrollHeight - bottomPadding.height();
    },

    topDataPos() {
      return topPadding.height();
    },

    bottomVisiblePos() {
      return viewport.scrollTop() + viewport.outerHeight();
    },

    topVisiblePos() {
      return viewport.scrollTop();
    },

    insertElement(e, sibling) {
      return elementRoutines.insertElement(e, sibling || topPadding.element);
    },

    insertElementAnimated(e, sibling) {
      return elementRoutines.insertElementAnimated(e, sibling || topPadding.element);
    },

    shouldLoadBottom() {
      return !buffer.eof && viewport.bottomDataPos() < viewport.bottomVisiblePos() + bufferPadding();
    },

    clipBottom() {
      // clip the invisible items off the bottom
      let overage = 0;
      let emptySpaceHeight = viewport.bottomDataPos() - viewport.bottomVisiblePos() - bufferPadding();
      if(rowHeight) {
        overage = Math.min(buffer.length,Math.floor(emptySpaceHeight/rowHeight));
      } else {
        let itemHeight = 0;
        let overageHeight = 0;

        for (let i = buffer.length - 1; i >= 0; i--) {
          itemHeight = buffer[i].element.outerHeight(true);
          if (overageHeight + itemHeight > emptySpaceHeight) {
            break;
          }
          bottomPadding.cache.add(buffer[i]);
          overageHeight += itemHeight;
          overage++;
        }
      }

      if (overage > 0) {
        buffer.eof = false;
        buffer.remove(buffer.length - overage, buffer.length);
        buffer.next -= overage;
        viewport.adjustPaddings();
      }
    },

    shouldLoadTop() {
      return !buffer.bof && (viewport.topDataPos() > viewport.topVisiblePos() - bufferPadding());
    },

    clipTop() {
      // clip the invisible items off the top
      let overage = 0;
      let overageHeight = 0;
      let emptySpaceHeight = viewport.topVisiblePos() - viewport.topDataPos() - bufferPadding();
      if(rowHeight) {
        overage = Math.min(buffer.length,Math.floor(emptySpaceHeight/rowHeight));
        overageHeight = overage * rowHeight;
      } else {
        let itemHeight = 0;

        for (let i = 0; i < buffer.length; i++) {
          itemHeight = buffer[i].element.outerHeight(true);
          if (overageHeight + itemHeight > emptySpaceHeight) {
            break;
          }
          topPadding.cache.add(buffer[i]);
          overageHeight += itemHeight;
          overage++;
        }
      }

      if (overage > 0) {
        // we need to adjust top padding element before items are removed from top
        // to avoid strange behaviour of scroll bar during remove top items when we are at the very bottom
        topPadding.height(topPadding.height() + overageHeight);
        buffer.bof = false;
        buffer.remove(0, overage);
        buffer.first += overage;
      }
    },

    // PHIL: remove all the entries in the buffer without changing the scrollbar, nor the scroll position
    // and update the padding accordingly
    // It is designed to work with non fixed rowHeight, although it will need more tests in this area...
    scrollTo(first) {
      if(rowHeight) {
        first = Math.min(first, buffer.maxIndex);
        first = Math.max(first, buffer.minIndex);
        const min = buffer.getAbsMinIndex(); 
        const max = buffer.getAbsMaxIndex();
        // Adjust the paddings before removing the elements to avoid touching the scroll top position
        topPadding.height((first-min)*rowHeight);
        bottomPadding.height(((max+1)-first)*rowHeight);
        buffer.resetStartIndex(first);
      } else {
        buffer.resetStartIndex(first);
        viewport.adjustPaddings();
      } 
    },
   
    adjustPaddings() {
      if(rowHeight) {
        const min = buffer.getAbsMinIndex(); 
        const max = buffer.getAbsMaxIndex();
        topPadding.height((buffer.first-min)*rowHeight);
        // PHIL: next points to the next possible item, while max is the index of the last one.
        // In order to make them compatible, we should add one to max
        // Also, it looks like buffer is not changing maxIndex when an element is inserted/appended
        // Not sure if this can have a consequence or not....
        bottomPadding.height(((max+1)-buffer.next)*rowHeight);
        return;
      }

      if (!buffer.length) {
        return;
      }

      // precise heights calculation based on items that are in buffer or that were in buffer once
      const visibleItemsHeight = buffer.reduce((summ, item) => summ + item.element.outerHeight(true), 0);
      let topPaddingHeight = 0, topCount = 0;
      topPadding.cache.forEach(item => {
        if(item.index < buffer.first) {
          topPaddingHeight += item.height;
          topCount++;
        }
      });
 
      let bottomPaddingHeight = 0, bottomCount = 0;
      bottomPadding.cache.forEach(item => {
        if(item.index >= buffer.next) {
          bottomPaddingHeight += item.height;
          bottomCount++;
        }
      });
 
      const totalHeight = visibleItemsHeight + topPaddingHeight + bottomPaddingHeight;
      const averageItemHeight = totalHeight / (topCount + bottomCount + buffer.length);   

      // average heights calculation, items that have never been reached
      let adjustTopPadding = buffer.minIndexUser !== null && buffer.minIndex > buffer.minIndexUser;
      let adjustBottomPadding = buffer.maxIndexUser !== null && buffer.maxIndex < buffer.maxIndexUser;
      let topPaddingHeightAdd = adjustTopPadding ? (buffer.minIndex - buffer.minIndexUser) * averageItemHeight : 0;
      let bottomPaddingHeightAdd = adjustBottomPadding ? (buffer.maxIndexUser - buffer.maxIndex) * averageItemHeight : 0;

      // paddings combine adjustment
      topPadding.height(topPaddingHeight + topPaddingHeightAdd);
      bottomPadding.height(bottomPaddingHeight + bottomPaddingHeightAdd);
    },

    onAfterMinIndexSet(topPaddingHeightOld) {
      // additional scrollTop adjustment in case of datasource.minIndex external set
      if (buffer.minIndexUser !== null && buffer.minIndex > buffer.minIndexUser) {
        let diff = topPadding.height() - topPaddingHeightOld;
        viewport.scrollTop(viewport.scrollTop() + diff);
        while((diff -= viewport.scrollTop()) > 0) {
          bottomPadding.height(bottomPadding.height() + diff);
          viewport.scrollTop(viewport.scrollTop() + diff);
        }
      }
    },

    onAfterPrepend(updates) {
      if (!updates.prepended.length)
        return;
      const height = buffer.effectiveHeight(updates.prepended);
      const paddingHeight = topPadding.height() - height;
      if (paddingHeight >= 0) {
        topPadding.height(paddingHeight);
      }
      else {
        topPadding.height(0);
        viewport.scrollTop(viewport.scrollTop() - paddingHeight);
      }
    },

    resetTopPadding() {
      topPadding.height(0);
      if(topPadding.cache) {
        topPadding.cache.clear();
      }
    },

    resetBottomPadding() {
      bottomPadding.height(0);
      if(bottomPadding.cache) {
        bottomPadding.cache.clear();
      }
    },

    removeCacheItem(item, isTop) {
      if(topPadding.cache) {
        topPadding.cache.remove(item, isTop);
      }
      if(bottomPadding.cache) {
        bottomPadding.cache.remove(item, isTop);
      }
    },

    removeItem(item) {
      this.removeCacheItem(item);
      return buffer.remove(item);
    }
  });

  return viewport;
}
