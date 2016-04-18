export default function Buffer(elementRoutines, itemName, $scope, linker, bufferSize) {
	const buffer = Object.create(Array.prototype);

	angular.extend(buffer, {
		size: bufferSize,

		reset(startIndex) {
			buffer.remove(0, buffer.length);
			buffer.eof = false;
			buffer.bof = false;
			buffer.first = startIndex;
			buffer.next = startIndex;
			buffer.minIndex = startIndex;
			buffer.maxIndex = startIndex;
			buffer.minIndexUser = null;
			buffer.maxIndexUser = null;
		},

		append(items) {
			items.forEach((item) => {
				++buffer.next;
				buffer.insert('append', item);
			});
		},

		prepend(items) {
			items.reverse().forEach((item) => {
				--buffer.first;
				buffer.insert('prepend', item);
			});
		},

		/**
		 * inserts wrapped element in the buffer
		 * the first argument is either operation keyword (see below) or a number for operation 'insert'
		 * for insert the number is the index for the buffer element the new one have to be inserted after
		 * operations: 'append', 'prepend', 'insert', 'remove', 'update', 'none'
		 */
		insert(operation, item) {
			const itemScope = $scope.$new();
			const wrapper = {
				item,
				scope: itemScope
			};

			itemScope[itemName] = item;

			linker(itemScope, (clone) => wrapper.element = clone);

			if (operation % 1 === 0) {// it is an insert
				wrapper.op = 'insert';
				buffer.splice(operation, 0, wrapper);
			} else {
				wrapper.op = operation;
				switch (operation) {
					case 'append':
						buffer.push(wrapper);
						break;
					case 'prepend':
						buffer.unshift(wrapper);
						break;
				}
			}
		},

		// removes elements from buffer
		remove(arg1, arg2) {
			if (angular.isNumber(arg1)) {
				// removes items from arg1 (including) through arg2 (excluding)
				for (let i = arg1; i < arg2; i++) {
					elementRoutines.removeElement(buffer[i]);
				}

				return buffer.splice(arg1, arg2 - arg1);
			}
			// removes single item(wrapper) from the buffer
			buffer.splice(buffer.indexOf(arg1), 1);

			return elementRoutines.removeElementAnimated(arg1);
		},

		setUpper() {
			buffer.maxIndex = buffer.eof ? buffer.next - 1 : Math.max(buffer.next - 1, buffer.maxIndex);
		},

		setLower() {
			buffer.minIndex = buffer.bof ? buffer.minIndex = buffer.first : Math.min(buffer.first, buffer.minIndex);
		}

	});

	return buffer;
}