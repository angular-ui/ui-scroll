export default function Adapter($parse, $attr, viewport, buffer, adjustBuffer) {
	const viewportScope = viewport.scope() || $rootScope;
	const setTopVisible = $attr.topVisible ? $parse($attr.topVisible).assign : angular.noop;
	const setTopVisibleElement = $attr.topVisibleElement ? $parse($attr.topVisibleElement).assign : angular.noop;
	const setTopVisibleScope = $attr.topVisibleScope ? $parse($attr.topVisibleScope).assign : angular.noop;
	const setIsLoading = $attr.isLoading ? $parse($attr.isLoading).assign : angular.noop;

	this.isLoading = false;

	function applyUpdate(wrapper, newItems) {
		if (!angular.isArray(newItems)) {
			return;
		}

		let keepIt;
		let pos = (buffer.indexOf(wrapper)) + 1;

		newItems.reverse().forEach((newItem) => {
			if (newItem === wrapper.item) {
				keepIt = true;
				pos--;
			} else {
				buffer.insert(pos, newItem);
			}
		});

		if (!keepIt) {
			wrapper.op = 'remove';
		}
	}

	this.applyUpdates = (arg1, arg2) => {
		if (angular.isFunction(arg1)) {
			// arg1 is the updater function, arg2 is ignored
			buffer.slice(0).forEach((wrapper) => {
				// we need to do it on the buffer clone, because buffer content
				// may change as we iterate through
				applyUpdate(wrapper, arg1(wrapper.item, wrapper.scope, wrapper.element));
			});
		} else {
			// arg1 is item index, arg2 is the newItems array
			if (arg1 % 1 !== 0) {// checking if it is an integer
				throw new Error('applyUpdates - ' + arg1 + ' is not a valid index');
			}

			const index = arg1 - buffer.first;
			if ((index >= 0 && index < buffer.length)) {
				applyUpdate(buffer[index], arg2);
			}
		}

		adjustBuffer();
	};

	this.append = (newItems) => {
		buffer.append(newItems);
		adjustBuffer();
	};

	this.prepend = (newItems) => {
		buffer.prepend(newItems);
		adjustBuffer();
	};

	this.loading = function (value) {
		this.isLoading = value;
		setIsLoading(viewportScope, value);
	};

	this.calculateProperties = function () {
		let i, item, itemHeight, itemTop, isNewRow, rowTop;
		let topHeight = 0;
		for (i = 0; i < buffer.length; i++) {
			item = buffer[i];
			itemTop = item.element.offset().top;
			isNewRow = rowTop !== itemTop;
			rowTop = itemTop;
			if (isNewRow) {
				itemHeight = item.element.outerHeight(true);
			}
			if (isNewRow && (viewport.topDataPos() + topHeight + itemHeight <= viewport.topVisiblePos())) {
				topHeight += itemHeight;
			} else {
				if (isNewRow) {
					this.topVisible = item.item;
					this.topVisibleElement = item.element;
					this.topVisibleScope = item.scope;
					setTopVisible(viewportScope, item.item);
					setTopVisibleElement(viewportScope, item.element);
					setTopVisibleScope(viewportScope, item.scope);
				}
				break;

			}
		}
	};
}