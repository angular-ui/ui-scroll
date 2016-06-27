/*!
 globals: angular, window

 List of used element methods available in JQuery but not in JQuery Lite

 element.before(elem)
 element.height()
 element.outerHeight(true)
 element.height(value) = only for Top/Bottom padding elements
 element.scrollTop()
 element.scrollTop(value)
 */
angular.module('ui.scroll', [])
  .directive('uiScrollViewport', function () {
    return {
      restrict: 'A',
      controller: [
        '$log',
        '$scope',
        '$element',
        function (console, scope, element) {
          let self = this;
          self.container = element;
          self.viewport = element;

          angular.forEach(element.children(),
            (child => {
              if (child.tagName.toLowerCase() === 'tbody') {
                self.viewport = angular.element(child);
              }
            }));
        }
      ]
    };
  })
  .directive('uiScroll', [
    '$log',
    '$injector',
    '$rootScope',
    '$timeout',
    '$q',
    '$parse',
    function (console, $injector, $rootScope, $timeout, $q, $parse) {
      const $animate = ($injector.has && $injector.has('$animate')) ? $injector.get('$animate') : null;
      const isAngularVersionLessThen1_3 = angular.version.major === 1 && angular.version.minor < 3;

      return {
        require: ['?^^uiScrollViewport'],
        restrict: 'A',
        transclude: 'element',
        priority: 1000,
        terminal: true,
        link: link
      };

      // Element manipulation routines
      function insertElement(newElement, previousElement) {
        previousElement.after(newElement);
        return [];
      }

      function removeElement(wrapper) {
        wrapper.element.remove();
        wrapper.scope.$destroy();
        return [];
      }

      function insertElementAnimated(newElement, previousElement) {
        if (!$animate) {
          return insertElement(newElement, previousElement);
        }

        if (isAngularVersionLessThen1_3) {
          const deferred = $q.defer();
          // no need for parent - previous element is never null
          $animate.enter(newElement, null, previousElement, () => deferred.resolve());

          return [deferred.promise];
        }

        // no need for parent - previous element is never null
        return [$animate.enter(newElement, null, previousElement)];
      }

      function removeElementAnimated(wrapper) {
        if (!$animate) {
          return removeElement(wrapper);
        }

        if (isAngularVersionLessThen1_3) {
          const deferred = $q.defer();
          $animate.leave(wrapper.element, () => {
            wrapper.scope.$destroy();
            return deferred.resolve();
          });

          return [deferred.promise];
        }

        return [($animate.leave(wrapper.element)).then(() => wrapper.scope.$destroy())];
      }

      function Buffer(bufferSize) {
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

          prepend(items) {
            items.reverse().forEach((item) => {
              --buffer.first;
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
          insert(operation, item) {
            const wrapper = {
              item : item
            };

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
                removeElement(buffer[i]);
              }

              return buffer.splice(arg1, arg2 - arg1);
            }
            // removes single item(wrapper) from the buffer
            buffer.splice(buffer.indexOf(arg1), 1);

            return removeElementAnimated(arg1);
          },

          effectiveHeight(elements) {
            if (!elements.length)
              return 0;
            let top = Number.MAX_VALUE;
            let bottom = Number.MIN_VALUE;
            elements.forEach((wrapper) => {
              if (wrapper.element[0].offsetParent) {
                // element style is not display:none
                top = Math.min(top, wrapper.element.offset().top);
                bottom = Math.max(bottom, wrapper.element.offset().top + wrapper.element.outerHeight(true));
              }
            });
            return Math.max(0, bottom - top);
          }

        });

        return buffer;
      }

      function Viewport(buffer, element, viewportController, attrs) {
        const PADDING_MIN = 0.3;
        const PADDING_DEFAULT = 0.5;
        let topPadding;
        let bottomPadding;
        const viewport = viewportController && viewportController.viewport ? viewportController.viewport : angular.element(window);
        const container = viewportController && viewportController.container ? viewportController.container : undefined;

        viewport.css({
          'overflow-y': 'auto',
          'display': 'block'
        });

        function Cache() {
          const cache = Object.create(Array.prototype);

          angular.extend(cache, {
            add(item) {
              let existedItem = cache.find(i => i.index === item.scope.$index);
              if (existedItem) {
                existedItem.height = item.element.outerHeight();
                return;
              }
              cache.push({
                index: item.scope.$index,
                height: item.element.outerHeight()
              });
            },
            clear() {
              cache.length = 0;
            }
          });

          return cache;
        }

        function Padding(template) {
          let result;

          switch (template.tagName) {
            case 'dl':
              throw new Error(`ui-scroll directive does not support <${template.tagName}> as a repeating tag: ${template.outerHTML}`);
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

          result.cache = new Cache();

          return result;
        }

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

          applyContainerStyle() {
            if (container && container !== viewport)
              viewport.css('height', window.getComputedStyle(container[0]).height);
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
            return insertElement(e, sibling || topPadding);
          },

          insertElementAnimated(e, sibling) {
            return insertElementAnimated(e, sibling || topPadding);
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

          adjustPadding() {
            if (!buffer.length)
              return;

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
            if(!updates.prepended.length)
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

      function Adapter($attr, viewport, buffer, adjustBuffer) {
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
          let item, itemHeight, itemTop, isNewRow, rowTop;
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
            let match = expression.match(/^(\S+)(?:\s+on\s+(\w(?:\w|\d)*))?$/);
            if (!match)
              throw new Error('Expected injection expression in form of \'target\' or \'target on controller\' but got \'' + expression + '\'');
            let target = match[1];
            let controllerName = match[2];
            if (controllerName) {
              let candidate = viewport;
              scope = undefined;
              while (candidate.length) {
                let controller = candidate.attr('ng-controller');
                if (controller === controllerName) {
                  scope = candidate.scope();
                  break;
                }
                candidate = candidate.parent();
              }
              if (!scope)
                throw new Error('Failed to locate target controller \'' + controllerName + '\' to inject \'' + target + '\'');
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

      function link($scope, element, $attr, controllers, linker) {

        const match = $attr.uiScroll.match(/^\s*(\w+)\s+in\s+([(\w|\$)\.]+)\s*$/);

        if (!(match))
          throw new Error('Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + $attr.uiScroll + '\'');

        let datasource = null;
        const itemName = match[1];
        const datasourceName = match[2];
        const bufferSize = Math.max(3, +$attr.bufferSize || 10);
        const viewportController = controllers[0];
        let startIndex = parseInt($attr.startIndex, 10);
        startIndex = isNaN(startIndex) ? 1 : startIndex;
        let ridActual = 0;// current data revision id
        let pending = [];

        let buffer = new Buffer(bufferSize);
        let viewport = new Viewport(buffer, element, viewportController, $attr);
        let adapter = new Adapter($attr, viewport, buffer, adjustBuffer);
        if (viewportController)
          viewportController.adapter = adapter;

        let isDatasourceValid = () => angular.isObject(datasource) && angular.isFunction(datasource.get);
        datasource = $parse(datasourceName)($scope); // try to get datasource on scope
        if (!isDatasourceValid()) {
          datasource = $injector.get(datasourceName); // try to inject datasource as service
          if (!isDatasourceValid()) {
            throw new Error(datasourceName + ' is not a valid datasource');
          }
        }

        let indexStore = {};
        function defineProperty(datasource, propName, propUserName) {
          let descriptor = Object.getOwnPropertyDescriptor(datasource, propName);
          if (!descriptor || (!descriptor.set && ! descriptor.get)) {
            Object.defineProperty(datasource, propName, {
              set: (value) => {
                indexStore[propName] = value;
                $timeout(() => {
                  buffer[propUserName] = value;
                  if(!pending.length) {
                    let topPaddingHeightOld = viewport.topDataPos();
                    viewport.adjustPadding();
                    if(propName === 'minIndex'){
                      viewport.adjustScrollTopAfterMinIndexSet(topPaddingHeightOld);
                    }
                  }
                });
              },
              get: () => indexStore[propName]
            });
          }
        }

        defineProperty(datasource, 'minIndex', 'minIndexUser');
        defineProperty(datasource, 'maxIndex', 'maxIndexUser');

        const fetchNext = (datasource.get.length !== 2) ? (success) => datasource.get(buffer.next, bufferSize, success)
          : (success) => {
              datasource.get({
                index: buffer.next,
                append: buffer.length ? buffer[buffer.length - 1].item : void 0,
                count: bufferSize
              }, success);
            };

        const fetchPrevious = (datasource.get.length !== 2) ? (success) => datasource.get(buffer.first - bufferSize, bufferSize, success)
          : (success) => {
              datasource.get({
                index: buffer.first - bufferSize,
                prepend: buffer.length ? buffer[0].item : void 0,
                count: bufferSize
              }, success);
            };

        adapter.reload = reload;

        /**
         * Build padding elements
         *
         * Calling linker is the only way I found to get access to the tag name of the template
         * to prevent the directive scope from pollution a new scope is created and destroyed
         * right after the builder creation is completed
         */
        linker((clone, scope) => {
          viewport.createPaddingElements(clone[0]);
          // we do not include the clone in the DOM. It means that the nested directives will not
          // be able to reach the parent directives, but in this case it is intentional because we
          // created the clone to access the template tag name
          scope.$destroy();
          clone.remove();
        });

        $scope.$on('$destroy', () => {
          unbindEvents();
          viewport.unbind('mousewheel', wheelHandler);
        });

        viewport.bind('mousewheel', wheelHandler);

        $timeout(() => {
          viewport.applyContainerStyle();
          reload();
        });

        /* Private function definitions */

        function isInvalid(rid) {
          return (rid && rid !== ridActual) || $scope.$$destroyed;
        }

        function bindEvents() {
          viewport.bind('resize', resizeAndScrollHandler);
          viewport.bind('scroll', resizeAndScrollHandler);
        }

        function unbindEvents() {
          viewport.unbind('resize', resizeAndScrollHandler);
          viewport.unbind('scroll', resizeAndScrollHandler);
        }

        function reload() {
          viewport.resetTopPadding();
          viewport.resetBottomPadding();

          if (arguments.length)
            startIndex = arguments[0];

          buffer.reset(startIndex);
          adjustBuffer();
        }

        function isElementVisible(wrapper) {
          return wrapper.element.height() && wrapper.element[0].offsetParent;
        }

        function visibilityWatcher(wrapper) {
          if (isElementVisible(wrapper)) {
            buffer.forEach((item) => {
              if (angular.isFunction(item.unregisterVisibilityWatcher)) {
                item.unregisterVisibilityWatcher();
                delete item.unregisterVisibilityWatcher;
              }
            });
            adjustBuffer();
          }
        }

        function insertWrapperContent(wrapper, insertAfter) {
          createElement(wrapper, insertAfter, viewport.insertElement);
          if (!isElementVisible(wrapper)) {
            wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch(() => visibilityWatcher(wrapper));
          }
          wrapper.element.addClass('ng-hide'); // hide inserted elements before data binding
        }

        function createElement(wrapper, insertAfter, insertElement) {
          let promises;
          let sibling = (insertAfter > 0) ? buffer[insertAfter - 1].element : undefined;
          linker((clone, scope) => {
            promises = insertElement(clone, sibling);
            wrapper.element = clone;
            wrapper.scope = scope;
            scope[itemName] = wrapper.item;
          });
          if (adapter.transform)
            adapter.transform(wrapper.scope, wrapper.element);
          return promises;
        }

        function updateDOM() {

          let promises = [];
          const toBePrepended = [];
          const toBeRemoved = [];
          const inserted = [];

          buffer.forEach((wrapper, i) => {
            switch (wrapper.op) {
              case 'prepend':
                toBePrepended.unshift(wrapper);
                break;
              case 'append':
                insertWrapperContent(wrapper, i);
                wrapper.op = 'none';
                inserted.push(wrapper);
                break;
              case 'insert':
                promises = promises.concat(createElement(wrapper, i, viewport.insertElementAnimated));
                wrapper.op = 'none';
                inserted.push(wrapper);
                break;
              case 'remove':
                toBeRemoved.push(wrapper);
            }
          });

          toBeRemoved.forEach((wrapper) => promises = promises.concat(buffer.remove(wrapper)));

          if (toBePrepended.length)
            toBePrepended.forEach((wrapper) => {
              insertWrapperContent(wrapper);
              wrapper.op = 'none';
            });

          buffer.forEach((item, i) => item.scope.$index = buffer.first + i);

          return {
            prepended: toBePrepended,
            removed: toBeRemoved,
            inserted: inserted,
            animated: promises
          };

        }

        function updatePaddings(rid, updates) {
          // schedule another adjustBuffer after animation completion
          if (updates.animated.length) {
            $q.all(updates.animated).then(() => {
              viewport.adjustPadding();
              adjustBuffer(rid);
            });
          } else {
            viewport.adjustPadding();
          }
        }

        function enqueueFetch(rid, updates) {
          if (viewport.shouldLoadBottom()) {
            if(!updates || buffer.effectiveHeight(updates.inserted) > 0) {
              // this means that at least one item appended in the last batch has height > 0
              if (pending.push(true) === 1) {
                fetch(rid);
                adapter.loading(true);
              }
            }
          } else if (viewport.shouldLoadTop()) {
            if ((!updates || buffer.effectiveHeight(updates.prepended) > 0) || pending[0]) {
              // this means that at least one item appended in the last batch has height > 0
              // pending[0] = true means that previous fetch was appending. We need to force at least one prepend
              // BTW there will always be at least 1 element in the pending array because bottom is fetched first
              if (pending.push(false) === 1) {
                fetch(rid);
                adapter.loading(true);
              }
            }
          }
        }

        function adjustBuffer(rid) {
          if(!rid) { // dismiss pending requests
            pending = [];
            rid = ++ridActual;
          }

          let updates = updateDOM();

          // We need the item bindings to be processed before we can do adjustment
          $timeout(() => {

            // show elements after data binging has been done
            updates.inserted.forEach(w => w.element.removeClass('ng-hide'));
            updates.prepended.forEach(w => w.element.removeClass('ng-hide'));

            if (isInvalid(rid)) {
              return;
            }

            updatePaddings(rid, updates);
            enqueueFetch(rid);

            if (!pending.length) {
              adapter.calculateProperties();
            }
          });
        }

        function adjustBufferAfterFetch(rid) {
          let updates = updateDOM();

          // We need the item bindings to be processed before we can do adjustment
          $timeout(() => {

            // show elements after data binging has been done
            updates.inserted.forEach(w => w.element.removeClass('ng-hide'));
            updates.prepended.forEach(w => w.element.removeClass('ng-hide'));

            viewport.adjustScrollTopAfterPrepend(updates);

            if (isInvalid(rid)) {
              return;
            }

            updatePaddings(rid, updates);
            enqueueFetch(rid, updates);
            pending.shift();

            if (pending.length)
              fetch(rid);
            else {
              adapter.loading(false);
              bindEvents();
              adapter.calculateProperties();
            }
          });
        }

        function fetch(rid) {
          if (pending[0]) {// scrolling down
            if (buffer.length && !viewport.shouldLoadBottom()) {
              adjustBufferAfterFetch(rid);
            } else {
              fetchNext((result) => {
                if (isInvalid(rid)) {
                  return;
                }

                if (result.length < bufferSize) {
                  buffer.eof = true;
                }

                if (result.length > 0) {
                  viewport.clipTop();
                  buffer.append(result);
                }

                adjustBufferAfterFetch(rid);
              });
            }
          } else {  // scrolling up
            if (buffer.length && !viewport.shouldLoadTop()) {
              adjustBufferAfterFetch(rid);
            } else {
              fetchPrevious((result) => {
                if (isInvalid(rid)) {
                  return;
                }

                if (result.length < bufferSize) {
                  buffer.bof = true;
                  // log 'bof is reached'
                }

                if (result.length > 0) {
                  if (buffer.length) {
                    viewport.clipBottom();
                  }
                  buffer.prepend(result);
                }

                adjustBufferAfterFetch(rid);
              });
            }
          }
        }

        function resizeAndScrollHandler() {
          if (!$rootScope.$$phase && !adapter.isLoading && !adapter.disabled) {

            enqueueFetch(ridActual);

            if (pending.length) {
              unbindEvents();
            } else {
              adapter.calculateProperties();
              $scope.$apply();
            }
          }
        }

        function wheelHandler(event) {
          if(!adapter.disabled) {
            let scrollTop = viewport[0].scrollTop;
            let yMax = viewport[0].scrollHeight - viewport[0].clientHeight;

            if ((scrollTop === 0 && !buffer.bof) || (scrollTop === yMax && !buffer.eof)) {
              event.preventDefault();
            }
          }
        }
      }
    }
  ]);
