function findCtrl(scope, ctrl) {
  if (!scope) {
    return;
  }
  if (scope.hasOwnProperty(ctrl) && Object.getPrototypeOf(scope[ctrl]).constructor.hasOwnProperty('$inject')) {
    return scope[ctrl];
  }
  return findCtrl(scope.$parent, ctrl);
}

function assignAttr(attr, scope, element) {
  if (!attr || !(attr = attr.replace(/^\s+|\s+$/gm, ''))) {
    return;
  }

  let onSyntax = attr.match(/^(.+)(\s+on\s+)(.+)?/);
  let asSyntax = attr.match(/^([^.]+)\.(.+)?/);

  if (onSyntax && onSyntax.length === 4) { // controller on (backward compatibility), deprecated since v1.6.1
    window.console.warn('Angular ui-scroll adapter assignment warning. "Controller On" syntax has been deprecated since ui-scroll v1.6.1.');
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
  else if (asSyntax && asSyntax.length === 3) { // controller as
    let ctrl = asSyntax[1];
    let tail = asSyntax[2];
    let foundCtrl = findCtrl(scope, ctrl);
    if (foundCtrl) {
      return {
        target: foundCtrl,
        source: tail
      };
    }
  }

  return {
    target: scope,
    source: attr
  };
}

class Adapter {

  constructor(viewport, buffer, adjustBuffer, reload, $attr, $parse, element) {
    this.viewport = viewport;
    this.buffer = buffer;
    this.adjustBuffer = adjustBuffer;
    this.reload = reload;

    this.publicContext = {};
    this.assignAdapter($attr, $parse, element);
    this.generatePublicContext($attr, $parse, element);

    this.isLoading = false;
    this.disabled = false;
  }

  assignAdapter($attr, $parse, element) {
    let data = assignAttr($attr.adapter, this.viewport.getScope(), element);

    if (data) {
      try {
        $parse(data.source).assign(data.target, {});
        let adapterOnScope = $parse(data.source)(data.target);

        angular.extend(adapterOnScope, this.publicContext);
        this.publicContext = adapterOnScope;
      }
      catch (error) {
        error.message = `Angular ui-scroll Adapter assignment exception.\n` +
          `Can't parse "${$attr.adapter}" expression.\n` +
          error.message;
        throw error;
      }
    }
  }

  generatePublicContext($attr, $parse, element) {
    // these methods will be accessible out of ui-scroll via user defined adapter
    const publicMethods = ['reload', 'applyUpdates', 'append', 'prepend', 'isBOF', 'isEOF', 'isEmpty'];
    for (let i = publicMethods.length - 1; i >= 0; i--) {
      this.publicContext[publicMethods[i]] = this[publicMethods[i]].bind(this);
    }

    // these read-only props will be accessible out of ui-scroll via user defined adapter
    const publicProps = ['isLoading', 'topVisible', 'topVisibleElement', 'topVisibleScope'];
    for (let i = publicProps.length - 1; i >= 0; i--) {
      let property, assignProp;
      let data = assignAttr($attr[publicProps[i]], this.viewport.getScope(), element);
      if (data) {
        assignProp = $parse(data.source).assign;
      }
      Object.defineProperty(this, publicProps[i], {
        get: () => property,
        set: (value) => {
          property = value;
          if (assignProp) {
            assignProp(data.target, value);
          }
          this.publicContext[publicProps[i]] = value;
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

  applyUpdates(arg1, arg2) {
    if (angular.isFunction(arg1)) {
      // arg1 is the updater function, arg2 is ignored
      this.buffer.slice(0).forEach((wrapper) => {
        // we need to do it on the buffer clone, because buffer content
        // may change as we iterate through
        this.applyUpdate(wrapper, arg1(wrapper.item, wrapper.scope, wrapper.element));
      });
    } else {
      // arg1 is item index, arg2 is the newItems array
      if (arg1 % 1 !== 0) {// checking if it is an integer
        throw new Error('applyUpdates - ' + arg1 + ' is not a valid index');
      }

      const index = arg1 - this.buffer.first;
      if ((index >= 0 && index < this.buffer.length)) {
        this.applyUpdate(this.buffer[index], arg2);
      }
    }

    this.adjustBuffer();
  }

  append(newItems) {
    this.buffer.append(newItems);
    this.adjustBuffer();
  }

  prepend(newItems) {
    this.buffer.prepend(newItems);
    this.adjustBuffer();
  }

  calculateProperties() {
    let item, itemHeight, itemTop, isNewRow, rowTop = null;
    let topHeight = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      item = this.buffer[i];
      itemTop = item.element.offset().top;
      isNewRow = rowTop !== itemTop;
      rowTop = itemTop;
      if (isNewRow) {
        itemHeight = item.element.outerHeight(true);
      }
      if (isNewRow && (this.viewport.topDataPos() + topHeight + itemHeight <= this.viewport.topVisiblePos())) {
        topHeight += itemHeight;
      } else {
        if (isNewRow) {
          this['topVisible'] = item.item;
          this['topVisibleElement'] = item.element;
          this['topVisibleScope'] = item.scope;
        }
        break;
      }
    }
  }

  applyUpdate(wrapper, newItems) {
    if (!angular.isArray(newItems)) {
      return;
    }

    let keepIt;
    let pos = (this.buffer.indexOf(wrapper)) + 1;

    newItems.reverse().forEach((newItem) => {
      if (newItem === wrapper.item) {
        keepIt = true;
        pos--;
      } else {
        this.buffer.insert(pos, newItem);
      }
    });

    if (!keepIt) {
      wrapper.op = 'remove';
    }
  }

}

export default Adapter;