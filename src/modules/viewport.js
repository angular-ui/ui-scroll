import Padding from './padding'

export default function Viewport(elementRoutines, buffer, element, controllers, attrs) {
	const PADDING_MIN = 0.3;
	const PADDING_DEFAULT = 0.5;
	let topPadding = null;
	let bottomPadding = null;
	const viewport = controllers[0] && controllers[0].viewport ? controllers[0].viewport : angular.element(window);

	viewport.css({
		'overflow-y': 'auto',
		'display': 'block'
	});

	function bufferPadding() {
		return viewport.outerHeight() * Math.max(PADDING_MIN, +attrs.padding || PADDING_DEFAULT); // some extra space to initiate preload
	}

	angular.extend(viewport, {
		createPaddingElements(template) {
			topPadding = new Padding(template);
			bottomPadding = new Padding(template);
			element.before(topPadding);
			element.after(bottomPadding);
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
				if(overageHeight + itemHeight > emptySpaceHeight) {
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
				if(overageHeight + itemHeight > emptySpaceHeight) {
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

		adjustPadding(adjustScrollTop) {
			if (!buffer.length) {
				return;
			}

			// precise heights calculation, items that were in buffer at some point
			let topPaddingHeight = 0;
			let bottomPaddingHeight = 0;

			if(topPadding.cache.length) {
				for (let i = topPadding.cache.length - 1; i >= 0; i--) {
					if (topPadding.cache[i].index < buffer.first) {
						topPaddingHeight += topPadding.cache[i].height;
					}
				}
			}
			if(bottomPadding.cache.length) {
				for (let i = bottomPadding.cache.length - 1; i >= 0; i--) {
					if(bottomPadding.cache[i].index >= buffer.next) {
						bottomPaddingHeight += bottomPadding.cache[i].height;
					}
				}
			}

			// average heights calculation, items that have never been reached
			let topPaddingHeightAdd = 0;
			let bottomPaddingHeightAdd = 0;
			let adjustTopPadding = buffer.minIndexUser && buffer.minIndex > buffer.minIndexUser;
			let adjustBottomPadding = buffer.maxIndexUser && buffer.maxIndex < buffer.maxIndexUser;

			if(adjustTopPadding || adjustBottomPadding) {
				let visibleItemsHeight = 0;
				for (let i = buffer.length - 1; i >= 0; i--) {
					visibleItemsHeight += buffer[i].element.outerHeight(true);
				}
				let averageItemHeight = (visibleItemsHeight + topPaddingHeight + bottomPaddingHeight) / (buffer.maxIndex - buffer.minIndex + 1);
				topPaddingHeightAdd = adjustTopPadding ? (buffer.minIndex - buffer.minIndexUser) * averageItemHeight : 0;
				bottomPaddingHeightAdd = adjustBottomPadding ? (buffer.maxIndexUser - buffer.maxIndex) * averageItemHeight : 0;
			}

			// paddings combine adjustement
			let topPaddingHeightOld = topPadding.height();
			topPadding.height(topPaddingHeight + topPaddingHeightAdd);
			bottomPadding.height(bottomPaddingHeight + bottomPaddingHeightAdd);

			// additional scrollTop adjustement in case of datasource.minIndex external set
			if (adjustScrollTop && adjustTopPadding && topPaddingHeightAdd) {
				let diff = topPadding.height() - topPaddingHeightOld;
				viewport.scrollTop(viewport.scrollTop() + diff);
			}
		},

		adjustScrollTopAfterPrepend(height) {
			const paddingHeight = topPadding.height() - height;

			if (paddingHeight >= 0) {
				topPadding.height(paddingHeight);
			} else {
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
