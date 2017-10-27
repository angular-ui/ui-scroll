function getCtrlOnData(attr, element) {
  let onSyntax = attr.match(/^(.+)(\s+on\s+)(.+)?/);
  if (onSyntax && onSyntax.length === 4) {
    window.console.log('Angular ui-scroll adapter assignment warning. "Controller On" syntax has been deprecated since ui-scroll v1.6.1.');
    let ctrl = onSyntax[3];
    let tail = onSyntax[1];
    let candidate = element;
    while (candidate.length) {
      let candidateScope = candidate.scope(); // doesn't work when debugInfoEnabled flag = true
      let candidateName = (candidate.attr('ng-controller') || '').match(/(\w(?:\w|\d)*)(?:\s+as\s+(\w(?:\w|\d)*))?/);
      if (candidateName && candidateName[1] === ctrl) {
        return {
          target: candidateScope,
          source: tail
        };
      }
      candidate = candidate.parent();
    }
    throw new Error('Angular ui-scroll adapter assignment error. Failed to locate target controller "' + ctrl + '" to inject "' + tail + '"');
  }
}

class Adapter {

  constructor(viewport, buffer, adjustBuffer, reload, $attr, $parse, element, $scope) {
    this.viewport = viewport;
    this.buffer = buffer;
    this.adjustBuffer = adjustBuffer;
    this.reload = reload;

    this.isLoading = false;
    this.disabled = false;

    const viewportScope = viewport.getScope();
    this.startScope = viewportScope.$parent ? viewportScope : $scope;

    this.publicContext = {};
    this.assignAdapter($attr.adapter, $parse, element);
    this.generatePublicContext($attr, $parse);
  }

  assignAdapter(adapterAttr, $parse, element) {
    if (!adapterAttr || !(adapterAttr = adapterAttr.replace(/^\s+|\s+$/gm, ''))) {
      return;
    }
    let ctrlOnData = getCtrlOnData(adapterAttr, element);
    let adapterOnScope;

    try {
      if (ctrlOnData) { // "Controller On", deprecated since v1.6.1
        $parse(ctrlOnData.source).assign(ctrlOnData.target, {});
        adapterOnScope = $parse(ctrlOnData.source)(ctrlOnData.target);
      }
      else {
        $parse(adapterAttr).assign(this.startScope, {});
        adapterOnScope = $parse(adapterAttr)(this.startScope);
      }
    }
    catch (error) {
      error.message = `Angular ui-scroll Adapter assignment exception.\n` +
        `Can't parse "${adapterAttr}" expression.\n` +
        error.message;
      throw error;
    }

    angular.extend(adapterOnScope, this.publicContext);
    this.publicContext = adapterOnScope;
  }

  generatePublicContext($attr, $parse) {
    // these methods will be accessible out of ui-scroll via user defined adapter
    const publicMethods = ['reload', 'applyUpdates', 'append', 'prepend', 'isBOF', 'isEOF', 'isEmpty'];
    for (let i = publicMethods.length - 1; i >= 0; i--) {
      this.publicContext[publicMethods[i]] = this[publicMethods[i]].bind(this);
    }

    // these read-only props will be accessible out of ui-scroll via user defined adapter
    const publicProps = ['isLoading', 'topVisible', 'topVisibleElement', 'topVisibleScope', 'bottomVisible', 'bottomVisibleElement', 'bottomVisibleScope'];
    for (let i = publicProps.length - 1; i >= 0; i--) {
      let property, attr = $attr[publicProps[i]];
      Object.defineProperty(this, publicProps[i], {
        get: () => property,
        set: (value) => {
          property = value;
          this.publicContext[publicProps[i]] = value;
          if (attr) {
            $parse(attr).assign(this.startScope, value);
          }
        }
      });
    }

    // non-read-only public property
    Object.defineProperty(this.publicContext, 'disabled', {
      get: () => this.disabled,
      set: (value) => (!(this.disabled = value)) ? this.adjustBuffer() : null
    });
  }

  loading(value) {
    this['isLoading'] = value;
  }

  isBOF() {
    return this.buffer.bof;
  }

  isEOF() {
    return this.buffer.eof;
  }

  isEmpty() {
    return !this.buffer.length;
  }

  append(newItems) {
    this.buffer.append(newItems);
    this.adjustBuffer();
    this.viewport.clipTop();
    this.viewport.clipBottom();
  }

  prepend(newItems) {
    this.buffer.prepend(newItems);
    this.adjustBuffer();
    this.viewport.clipTop();
    this.viewport.clipBottom();
  }

  applyUpdates(arg1, arg2) {
    if (angular.isFunction(arg1)) {
      this.applyUpdatesFunc(arg1);
    } else {
      this.applyUpdatesIndex(arg1, arg2);
    }
    this.adjustBuffer();
  }

  applyUpdatesFunc(cb) {
    this.buffer.slice(0).forEach((wrapper) => {
      // we need to do it on the buffer clone, because buffer content
      // may change as we iterate through
      this.applyUpdate(wrapper, cb(wrapper.item, wrapper.scope, wrapper.element));
    });
  }

  applyUpdatesIndex(index, newItems) {
    if (index % 1 !== 0) { // checking if it is an integer
      throw new Error('applyUpdates - ' + index + ' is not a valid index');
    }
    const _index = index - this.buffer.first;
    if (_index >= 0 && _index < this.buffer.length) {
      this.applyUpdate(this.buffer[_index], newItems);
    }
    else if(index >= this.buffer.minIndex && index <= this.buffer.maxIndex) {
      this.applyUpdateBuffer(index, newItems);
    }
  }

  applyUpdateBuffer(index, newItems) {
    if (!angular.isArray(newItems)) {
      return;
    }
    // remove single item
    if(!newItems.length) {
      var isTop = index === this.buffer.minIndex;
      if(isTop) {
        this.buffer.minIndex++;
      }
      else {
        this.buffer.maxIndex--;
      }
      this.viewport.removeCacheItem(index, isTop);
    }
  }

  applyUpdate(wrapper, newItems) {
    if (!angular.isArray(newItems)) {
      return;
    }
    let position = this.buffer.indexOf(wrapper);
    if (!newItems.reverse().some(newItem => newItem === wrapper.item)) {
      wrapper.op = 'remove';
      if(position === 0 && !newItems.length) {
        wrapper._op = 'isTop'; // to catch "first" edge case on remove
      }
    }
    newItems.forEach((newItem) => {
      if (newItem === wrapper.item) {
        position--;
      } else {
        // 3 parameter (isTop) is to catch "first" edge case on insert
        this.buffer.insert(position + 1, newItem, position === -1);
      }
    });
  }

  calculateProperties() {
    let rowTop = null, topHeight = 0;
    let topDone = false, bottomDone = false;
    const length = this.buffer.length;

    for (let i = 0; i < length; i++) {
      const item = this.buffer[i];
      const itemTop = item.element.offset().top;

      if (rowTop !== itemTop) { // a new row condition
        const itemHeight = item.element.outerHeight(true);
        const top = this.viewport.topDataPos() + topHeight + itemHeight;

        if (!topDone && top > this.viewport.topVisiblePos()) {
          topDone = true;
          this['topVisible'] = item.item;
          this['topVisibleElement'] = item.element;
          this['topVisibleScope'] = item.scope;
        }
        if (!bottomDone && (top >= this.viewport.bottomVisiblePos() || (i === length - 1 && this.isEOF()))) {
          bottomDone = true;
          this['bottomVisible'] = item.item;
          this['bottomVisibleElement'] = item.element;
          this['bottomVisibleScope'] = item.scope;
        }
        topHeight += itemHeight;
      }
      rowTop = itemTop;

      if (topDone && bottomDone) {
        break;
      }
    }
  }

}

export default Adapter;