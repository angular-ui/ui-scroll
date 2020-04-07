import Padding from './padding';

export default function Viewport(elementRoutines, buffer, element, viewportController, $rootScope, padding) {
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

  angular.extend(viewport, {
    getScope() {
      return scope;
    },

    createPaddingElements(template) {
      topPadding = new Padding(template);
      bottomPadding = new Padding(template);
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
      let overageHeight = 0;
      let itemHeight = 0;
      let emptySpaceHeight = viewport.bottomDataPos() - viewport.bottomVisiblePos() - bufferPadding();

      for (let i = buffer.length - 1; i >= 0; i--) {
        itemHeight = buffer[i].element.outerHeight(true);
        if (overageHeight + itemHeight > emptySpaceHeight) {
          break;
        }
        bottomPadding.cache.add(buffer[i]);
        overageHeight += itemHeight;
        overage++;
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
      let itemHeight = 0;
      let emptySpaceHeight = viewport.topVisiblePos() - viewport.topDataPos() - bufferPadding();

      for (let i = 0; i < buffer.length; i++) {
        itemHeight = buffer[i].element.outerHeight(true);
        if (overageHeight + itemHeight > emptySpaceHeight) {
          break;
        }
        topPadding.cache.add(buffer[i]);
        overageHeight += itemHeight;
        overage++;
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

    adjustPaddings() {
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
      if (!updates.prepended.length) {
        return;
      }
      const height = buffer.effectiveHeight(updates.prepended);
      const paddingHeight = topPadding.height() - height;
      if (paddingHeight >= 0) {
        topPadding.height(paddingHeight);
        return;
      }
      const position = viewport.scrollTop();
      const newPosition = position - paddingHeight;
      viewport.synthetic = { previous: position, next: newPosition };
      topPadding.height(0);
      viewport.scrollTop(newPosition);
    },

    resetTopPadding() {
      topPadding.height(0);
      topPadding.cache.clear();
    },

    resetBottomPadding() {
      bottomPadding.height(0);
      bottomPadding.cache.clear();
    },

    removeCacheItem(item, isTop) {
      topPadding.cache.remove(item, isTop);
      bottomPadding.cache.remove(item, isTop);
    },

    removeItem(item) {
      this.removeCacheItem(item);
      return buffer.remove(item);
    }
  });

  return viewport;
}
