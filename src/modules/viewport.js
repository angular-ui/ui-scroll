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
      element.before(topPadding);
      element.after(bottomPadding);
    },

    applyContainerStyle() {
      if (container && container !== viewport) {
        viewport.css('height', window.getComputedStyle(container[0]).height);
      }
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
      return elementRoutines.insertElement(e, sibling || topPadding);
    },

    insertElementAnimated(e, sibling) {
      return elementRoutines.insertElementAnimated(e, sibling || topPadding);
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
        viewport.adjustPadding();
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

    adjustPadding() {
      if (!buffer.length) {
        return;
      }

      // precise heights calculation, items that were in buffer once
      let topPaddingHeight = topPadding.cache.reduce((summ, item) => summ + (item.index < buffer.first ? item.height : 0), 0);
      let bottomPaddingHeight = bottomPadding.cache.reduce((summ, item) => summ + (item.index >= buffer.next ? item.height : 0), 0);

      // average item height based on buffer data
      let visibleItemsHeight = buffer.reduce((summ, item) => summ + item.element.outerHeight(true), 0);
      let averageItemHeight = (visibleItemsHeight + topPaddingHeight + bottomPaddingHeight) / (buffer.maxIndex - buffer.minIndex + 1);

      // average heights calculation, items that have never been reached
      let adjustTopPadding = buffer.minIndexUser !== null && buffer.minIndex > buffer.minIndexUser;
      let adjustBottomPadding = buffer.maxIndexUser !== null && buffer.maxIndex < buffer.maxIndexUser;
      let topPaddingHeightAdd = adjustTopPadding ? (buffer.minIndex - buffer.minIndexUser) * averageItemHeight : 0;
      let bottomPaddingHeightAdd = adjustBottomPadding ? (buffer.maxIndexUser - buffer.maxIndex) * averageItemHeight : 0;

      // paddings combine adjustment
      topPadding.height(topPaddingHeight + topPaddingHeightAdd);
      bottomPadding.height(bottomPaddingHeight + bottomPaddingHeightAdd);
    },

    adjustScrollTopAfterMinIndexSet(topPaddingHeightOld) {
      // additional scrollTop adjustment in case of datasource.minIndex external set
      if (buffer.minIndexUser !== null && buffer.minIndex > buffer.minIndexUser) {
        let diff = topPadding.height() - topPaddingHeightOld;
        viewport.scrollTop(viewport.scrollTop() + diff);
      }
    },

    adjustScrollTopAfterPrepend(updates) {
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
      topPadding.cache.clear();
    },

    resetBottomPadding() {
      bottomPadding.height(0);
      bottomPadding.cache.clear();
    }
  });

  return viewport;
}
