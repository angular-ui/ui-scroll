export default function ScrollBuffer(elementRoutines, bufferSize, startIndex) {
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
      buffer.maxIndex = buffer.eof ? buffer.next - 1 : Math.max(buffer.next - 1, buffer.maxIndex);
    },

    prepend(items, immutableTop) {
      items.reverse().forEach((item) => {
        if (immutableTop) {
          ++buffer.next;
        }
        else {
          --buffer.first;
        }
        buffer.insert('prepend', item);
      });
      buffer.minIndex = buffer.bof ? buffer.minIndex = buffer.first : Math.min(buffer.first, buffer.minIndex);
    },

    /**
     * inserts wrapped element in the buffer
     * the first argument is either operation keyword (see below) or a number for operation 'insert'
     * for insert the number is the index for the buffer element the new one have to be inserted after
     * operations: 'append', 'prepend', 'insert', 'remove', 'update', 'none'
     */
    insert(operation, item, isTop) {
      const wrapper = {
        item: item
      };

      if (operation % 1 === 0) {// it is an insert
        wrapper.op = 'insert';
        buffer.splice(operation, 0, wrapper);
        if(isTop) {
          buffer.first--;
        }
        else {
          buffer.next++;
        }
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
      if(arg1._op === 'isTop' && buffer.first === this.getAbsMinIndex()) {
        this.incrementMinIndex();
      }
      else {
        this.decrementMaxIndex();
      }
      if(arg1._op === 'isTop') {
        buffer.first++;
      }
      else {
        buffer.next--;
      }
      if(!buffer.length) {
        buffer.first = 1;
        buffer.next = 1;
      }

      return elementRoutines.removeElementAnimated(arg1);
    },

    incrementMinIndex() {
      if(buffer.minIndexUser !== null) {
        if(buffer.minIndex > buffer.minIndexUser) {
          buffer.minIndexUser++;
          return;
        }
        if(buffer.minIndex === buffer.minIndexUser) {
          buffer.minIndexUser++;
        }
      }
      buffer.minIndex++;
    },

    decrementMaxIndex() {
      if(buffer.maxIndexUser !== null && buffer.maxIndex <= buffer.maxIndexUser) {
        buffer.maxIndexUser--;
      }
      buffer.maxIndex--;
    },

    getAbsMinIndex() {
      if(buffer.minIndexUser !== null) {
        return Math.min(buffer.minIndexUser, buffer.minIndex);
      }
      return buffer.minIndex;
    },

    getAbsMaxIndex() {
      if(buffer.maxIndexUser !== null) {
        return Math.max(buffer.maxIndexUser, buffer.maxIndex);
      }
      return buffer.maxIndex;
    },

    effectiveHeight(elements) {
      if (!elements.length) {
        return 0;
      }
      let top = Number.MAX_VALUE;
      let bottom = Number.NEGATIVE_INFINITY;
      elements.forEach((wrapper) => {
        if (wrapper.element[0].offsetParent) {
          // element style is not display:none
          top = Math.min(top, wrapper.element.offset().top);
          bottom = Math.max(bottom, wrapper.element.offset().top + wrapper.element.outerHeight(true));
        }
      });
      return Math.max(0, bottom - top);
    },

    getItems() {
      return buffer.filter(item => item.op === 'none');
    },

    getFirstItem() {
      const list = buffer.getItems();
      if (!list.length) {
        return null;
      }
      return list[0].item;
    },

    getLastItem() {
      const list = buffer.getItems();
      if (!list.length) {
        return null;
      }
      return list[list.length - 1].item;
    }

  });

  buffer.reset(startIndex);

  return buffer;
}
