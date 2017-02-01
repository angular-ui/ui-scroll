export default function Adapter($rootScope, $parse, $attr, viewport, buffer, adjustBuffer, element) {
  const viewportScope = viewport.scope() || $rootScope;
  let disabled = false;
  let self = this;

  createValueInjector('adapter')(self);
  let topVisibleInjector = createValueInjector('topVisible');
  let topVisibleElementInjector = createValueInjector('topVisibleElement');
  let topVisibleScopeInjector = createValueInjector('topVisibleScope');
  let isLoadingInjector = createValueInjector('isLoading');

  // Adapter API definition

  Object.defineProperty(this, 'disabled', {
    get: () => disabled,
    set: (value) => (!(disabled = value)) ? adjustBuffer() : null
  });

  this.isLoading = false;
  this.isBOF = () => buffer.bof;
  this.isEOF = () => buffer.eof;
  this.isEmpty = () => !buffer.length;

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

  this.loading = (value) => {
    isLoadingInjector(value);
  };

  this.calculateProperties = () => {
    let item, itemHeight, itemTop, isNewRow, rowTop = null;
    let topHeight = 0;
    for (let i = 0; i < buffer.length; i++) {
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
          topVisibleInjector(item.item);
          topVisibleElementInjector(item.element);
          topVisibleScopeInjector(item.scope);
        }
        break;
      }
    }
  };

  // private function definitions

  function createValueInjector(attribute) {
    let expression = $attr[attribute];
    let scope = viewportScope;
    let assign;
    if (expression) {
      // it is ok to have relaxed validation for the first part of the 'on' expression.
      // additional validation will be done by the $parse service below
      let match = expression.match(/^(\S+)(?:\s+on\s+(\w(?:\w|\d)*))?/);
      if (!match)
        throw new Error('Expected injection expression in form of \'target\' or \'target on controller\' but got \'' + expression + '\'');
      let target = match[1];
      let onControllerName = match[2];

      let parseController = (controllerName, on) => {
        let candidate = element;
        while (candidate.length) {
          let candidateScope = candidate.scope();
          // ng-controller's "Controller As" parsing
          let candidateName = (candidate.attr('ng-controller') || '').match(/(\w(?:\w|\d)*)(?:\s+as\s+(\w(?:\w|\d)*))?/);
          if (candidateName && candidateName[on ? 1 : 2] === controllerName) {
            scope = candidateScope;
            return true;
          }
          // directive's/component's "Controller As" parsing
          if (!on && candidateScope && candidateScope.hasOwnProperty(controllerName) && Object.getPrototypeOf(candidateScope[controllerName]).constructor.hasOwnProperty('$inject')) {
            scope = candidateScope;
            return true;
          }
          candidate = candidate.parent();
        }
      };

      if (onControllerName) { // 'on' syntax DOM parsing (adapter="adapter on ctrl")
        scope = null;
        parseController(onControllerName, true);
        if (!scope) {
          throw new Error('Failed to locate target controller \'' + onControllerName + '\' to inject \'' + target + '\'');
        }
      }
      else { // try to parse DOM with 'Controller As' syntax (adapter="ctrl.adapter")
        let controllerAsName;
        let dotIndex = target.indexOf('.');
        if (dotIndex > 0) {
          controllerAsName = target.substr(0, dotIndex);
          parseController(controllerAsName, false);
        }
      }

      assign = $parse(target).assign;
    }
    return (value) => {
      if (self !== value) // just to avoid injecting adapter reference in the adapter itself. Kludgy, I know.
        self[attribute] = value;
      if (assign)
        assign(scope, value);
    };
  }

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

}