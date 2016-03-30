export function Viewport(elementRoutines, buffer, cache, element, controllers, attrs) {
	const PADDING_MIN = 0.3;
	const PADDING_DEFAULT = 0.5;
	let topPadding = null;
	let bottomPadding = null;
	let averageItemHeight = 0;
	const viewport = controllers[0] && controllers[0].viewport ? controllers[0].viewport : angular.element(window);

	viewport.css({
		'overflow-y': 'auto',
		'display': 'block'
	});

	let viewportOffset = viewport.offset() ? () => viewport.offset() : () => ({top: 0});

	function bufferPadding() {
		return viewport.outerHeight() * Math.max(PADDING_MIN, +attrs.padding || PADDING_DEFAULT); // some extra space to initiate preload
	}

	angular.extend(viewport, {
		createPaddingElements(template) {
			topPadding = new Padding(template);
			bottomPadding = new Padding(template);
			element.before(topPadding);
			element.after(bottomPadding);

			function Padding(template) {
				let result;
				let tagName = template.localName;

				switch (tagName) {
					case 'dl':
						throw new Error(`ui-scroll directive does not support <${tagName}> as a repeating tag: ${template.outerHTML}`);
					case 'tr':
						let table = angular.element('<table><tr><td><div></div></td></tr></table>');
						result = table.find('tr');
						break;
					case 'li':
						result = angular.element('<li></li>');
						break;
					default:
						result = angular.element('<div></div>');
				}

				return result;
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

			for (let i = buffer.length - 1; i >= 0; i--) {
				if (buffer[i].element.offset().top - viewportOffset().top <= viewport.outerHeight() + bufferPadding()) {
					break;
				}
				cache.add(buffer[i]);
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

			for (let i = 0; i < buffer.length; i++) {
				if (buffer[i].element.offset().top - viewportOffset().top + buffer[i].element.outerHeight(true) >= (-1) * bufferPadding()) {
					break;
				}
				cache.add(buffer[i]);
				overageHeight += buffer[i].element.outerHeight(true);
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
			if (!buffer.length || !cache.length) {
				return;
			}

			let topPaddingHeight = 0;
			let bottomPaddingHeight = 0;
			for (let i = cache.length - 1; i >= 0; i--) {
				if(cache[i].index < buffer.first) {
					topPaddingHeight += cache[i].height;
				}
				if(cache[i].index >= buffer.next) {
					bottomPaddingHeight += cache[i].height;
				}
			}

			topPadding.height(topPaddingHeight);
			bottomPadding.height(bottomPaddingHeight);
		},

		syncDatasource(datasource) {
			if (!buffer.length) {
				return;
			}

			const bufferFirstEl = buffer[0].element;
			const bufferLastEl = buffer[buffer.length - 1].element;
			averageItemHeight = (bufferLastEl.offset().top + bufferLastEl.outerHeight(true) - bufferFirstEl.offset().top) / buffer.length;

			const delta = buffer.syncDatasource(datasource) * averageItemHeight;

			topPadding.height(topPadding.height() + delta);

			viewport.scrollTop(viewport.scrollTop() + delta);

			viewport.adjustPadding();
		},

		adjustScrollTop(height) {
			const paddingHeight = topPadding.height() - height;

			if (paddingHeight >= 0) {
				topPadding.height(paddingHeight);
			} else {
				topPadding.height(0);
				viewport.scrollTop(viewport.scrollTop() - paddingHeight);
			}
		},
		resetTopPaddingHeight() {
			topPadding.height(0);
		},
		resetBottomPaddingHeight() {
			bottomPadding.height(0);
		}
	});

	return viewport;
}
