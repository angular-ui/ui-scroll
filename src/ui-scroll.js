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
      controller: [
        '$scope',
        '$element',
        function (scope, element) {
          this.viewport = element;
          return this;
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
      //const log = console.debug || console.log;

      return {
        require: ['?^uiScrollViewport'],
        transclude: 'element',
        priority: 1000,
        terminal: true,
        compile
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

      function Buffer(itemName, $scope, linker, bufferSize) {
        const buffer = Object.create(Array.prototype);

        function reset(origin) {
          buffer.eof = false;
          buffer.bof = false;
          buffer.first = origin;
          buffer.next = origin;
          buffer.minIndex = Number.MAX_VALUE;
          buffer.maxIndex = Number.MIN_VALUE;
        }

        angular.extend(buffer, {
          size: bufferSize,

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
                removeElement(buffer[i]);
              }

              return buffer.splice(arg1, arg2 - arg1);
            }
            // removes single item(wrapper) from the buffer
            buffer.splice(buffer.indexOf(arg1), 1);

            return removeElementAnimated(arg1);
          },

          setUpper() {
            buffer.maxIndex = buffer.eof ? buffer.next - 1 : Math.max(buffer.next - 1, buffer.maxIndex);
          },

          setLower() {
            buffer.minIndex = buffer.bof ? buffer.minIndex = buffer.first : Math.min(buffer.first, buffer.minIndex);
          },

          syncDatasource(datasource) {
            const offset = buffer.minIndex - (Math.min(buffer.minIndex, datasource.minIndex || Number.MAX_VALUE));

            datasource.minIndex = (buffer.minIndex -= offset);
            datasource.maxIndex = buffer.maxIndex = Math.max(buffer.maxIndex, datasource.maxIndex || Number.MIN_VALUE);

            return offset;
          },

          // clears the buffer
          clear() {
            buffer.remove(0, buffer.length);
            arguments.length ? reset(arguments[0]) : reset(1);
          }
        });

        reset(1);

        return buffer;
      }

      function Viewport(buffer, element, controllers, attrs) {
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

            for (let i = buffer.length - 1; i >= 0; i--) {
              if (buffer[i].element.offset().top - viewportOffset().top <= viewport.outerHeight() + bufferPadding()) {
                break;
              }
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
            if (!buffer.length) {
              return;
            }

            const bufferFirstEl = buffer[0].element;
            const bufferLastEl = buffer[buffer.length - 1].element;

            averageItemHeight = (bufferLastEl.offset().top + bufferLastEl.outerHeight(true) - bufferFirstEl.offset().top) / buffer.length;
            topPadding.height((buffer.first - buffer.minIndex) * averageItemHeight);

            return bottomPadding.height((buffer.maxIndex - buffer.next + 1) * averageItemHeight);
          },

          syncDatasource(datasource) {
            if (!buffer.length) {
              return;
            }

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

      function Adapter($attr, viewport, buffer, adjustBuffer) {
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

      function compile(elementTemplate, attr, compileLinker) {
        const match = attr.uiScroll.match(/^\s*(\w+)\s+in\s+([\w\.]+)\s*$/);

        if (!(match)) {
          throw new Error('Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + attr.uiScroll + '\'');
        }

        const itemName = match[1];
        const datasourceName = match[2];
        const bufferSize = Math.max(3, +attr.bufferSize || 10);

        return function link($scope, element, $attr, controllers, linker) {
          // starting from angular 1.2 compileLinker usage is deprecated
          linker = linker || compileLinker;

          const datasource = (() => {
            let _datasource = $parse(datasourceName)($scope);

            if (!isDatasourceValid()) {
              _datasource = $injector.get(datasourceName);
              if (!isDatasourceValid()) {
                throw new Error(datasourceName + ' is not a valid datasource');
              }
            }

            return _datasource;

            function isDatasourceValid() {
              // then try to inject datasource as service
              return angular.isObject(_datasource) && angular.isFunction(_datasource.get);
            }
          })();

          let ridActual = 0;// current data revision id
          let pending = [];
          let buffer = new Buffer(itemName, $scope, linker, bufferSize);
          let viewport = new Viewport(buffer, element, controllers, $attr);
          let adapter = new Adapter($attr, viewport, buffer, () => {
            dismissPendingRequests();
            return adjustBuffer(ridActual);
          });

          const fetchNext = (() => {
            if (datasource.get.length !== 2) {
              return (success) => datasource.get(buffer.next, bufferSize, success);
            }

            return (success) => {
              return datasource.get({
                index: buffer.next,
                append: buffer.length ? buffer[buffer.length - 1].item : void 0,
                count: bufferSize
              }, success);
            };
          })();

          const fetchPrevious = (() => {
            if (datasource.get.length !== 2) {
              return (success) => datasource.get(buffer.first - bufferSize, bufferSize, success);
            }

            return (success) => {
              return datasource.get({
                index: buffer.first - bufferSize,
                prepend: buffer.length ? buffer[0].item : void 0,
                count: bufferSize
              }, success);
            };
          })();

          if ($attr.adapter) {
            // so we have an adapter on $scope
            let adapterOnScope = $parse($attr.adapter)($scope);

            if (!angular.isObject(adapterOnScope)) {
              $parse($attr.adapter).assign($scope, {});
              adapterOnScope = $parse($attr.adapter)($scope);
            }

            adapter = angular.extend(adapterOnScope, adapter);
          }

          /**
           * Build padding elements
           *
           * Calling linker is the only way I found to get access to the tag name of the template
           * to prevent the directive scope from pollution a new scope is created and destroyed
           * right after the builder creation is completed
           */
          linker($scope.$new(), (template, scope) => {
            viewport.createPaddingElements(template[0]);
            // Destroy template's scope to remove any watchers on it.
            scope.$destroy();
            // We don't need template anymore.
            template.remove();
          });

          adapter.reload = reload;

          // events and bindings
          function bindEvents() {
            viewport.bind('resize', resizeAndScrollHandler);
            viewport.bind('scroll', resizeAndScrollHandler);
          }
          viewport.bind('mousewheel', wheelHandler);

          function unbindEvents() {
            viewport.unbind('resize', resizeAndScrollHandler);
            viewport.unbind('scroll', resizeAndScrollHandler);
          }

          $scope.$on('$destroy', () => {
            // clear the buffer. It is necessary to remove the elements and $destroy the scopes
            buffer.clear();
            unbindEvents();
            viewport.unbind('mousewheel', wheelHandler);
          });

          // update events (deprecated since v1.1.0, unsupported since 1.2.0)
          (() => {
            const eventListener = datasource.scope ? datasource.scope.$new() : $scope.$new();

            eventListener.$on('insert.item', () => unsupportedMethod('insert'));

            eventListener.$on('update.items', () => unsupportedMethod('update'));

            eventListener.$on('delete.items', () => unsupportedMethod('delete'));

            function unsupportedMethod(token) {
              throw new Error(token + ' event is no longer supported - use applyUpdates instead');
            }
          })();

          reload();

          /* Functions definitions */

          function dismissPendingRequests() {
            ridActual++;
            pending = [];
          }

          function reload() {
            dismissPendingRequests();

            viewport.resetTopPaddingHeight();
            viewport.resetBottomPaddingHeight();

            adapter.abCount = 0;
            adapter.abfCount = 0;
            adapter.sCount = 0;

            if (arguments.length) {
              buffer.clear(arguments[0]);
            } else {
              buffer.clear();
            }

            return adjustBuffer(ridActual);
          }

          function enqueueFetch(rid, direction) {
            if (!adapter.isLoading) {
              adapter.loading(true);
            }

            if (pending.push(direction) === 1) {
              return fetch(rid);
            }
          }

          function isElementVisible(wrapper) {
            return wrapper.element.height() && wrapper.element[0].offsetParent;
          }

          function visibilityWatcher(wrapper) {
            if (!isElementVisible(wrapper)) {
              return;
            }

            buffer.forEach((item) => {
              if (angular.isFunction(item.unregisterVisibilityWatcher)) {
                item.unregisterVisibilityWatcher();
                delete item.unregisterVisibilityWatcher;
              }
            });

            return adjustBuffer();
          }

          function insertWrapperContent(wrapper, sibling) {
            viewport.insertElement(wrapper.element, sibling);

            if (isElementVisible(wrapper)) {
              return true;
            }

            wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch(() => visibilityWatcher(wrapper));

            return false;
          }

          function processBufferedItems(rid) {
            let keepFetching = false;
            let promises = [];
            const toBePrepended = [];
            const toBeRemoved = [];

            function getPreSibling(i) {
              return (i > 0) ? buffer[i - 1].element : undefined;
            }

            buffer.forEach((wrapper, i) => {
              switch (wrapper.op) {
                case 'prepend':
                  toBePrepended.unshift(wrapper);
                  break;
                case 'append':
                  keepFetching = insertWrapperContent(wrapper, getPreSibling(i)) || keepFetching;
                  wrapper.op = 'none';
                  break;
                case 'insert':
                  promises = promises.concat(viewport.insertElementAnimated(wrapper.element, getPreSibling(i)));
                  wrapper.op = 'none';
                  break;
                case 'remove':
                  toBeRemoved.push(wrapper);
              }
            });

            toBeRemoved.forEach((wrapper) => promises = promises.concat(buffer.remove(wrapper)));

            if (toBePrepended.length) {
              let adjustedPaddingHeight = 0;

              toBePrepended.forEach((wrapper) => {
                keepFetching = insertWrapperContent(wrapper) || keepFetching;
                wrapper.op = 'none';
                adjustedPaddingHeight += wrapper.element.outerHeight(true);
              });

              viewport.adjustScrollTop(adjustedPaddingHeight);
            }

            // re-index the buffer
            buffer.forEach((item, i) => item.scope.$index = buffer.first + i);

            // schedule another adjustBuffer after animation completion
            if (promises.length) {
              $q.all(promises).then(() => {
                viewport.adjustPadding();
                // log "Animation completed rid #{rid}"
                return adjustBuffer(rid);
              });
            } else {
              viewport.adjustPadding();
              if (!pending.length) {
                viewport.syncDatasource(datasource);
              }
            }

            return keepFetching;
          }

          function adjustBuffer(rid) {
            // We need the item bindings to be processed before we can do adjustment
            return $timeout(() => {
              adapter.abCount++;
              processBufferedItems(rid);

              if (viewport.shouldLoadBottom()) {
                enqueueFetch(rid, true);
              } else if (viewport.shouldLoadTop()) {
                enqueueFetch(rid, false);
              }

              if (!pending.length) {
                return adapter.calculateProperties();
              }
            });
          }

          function adjustBufferAfterFetch(rid) {
            // We need the item bindings to be processed before we can do adjustment
            return $timeout(() => {
              adapter.abfCount++;
              let keepFetching = processBufferedItems(rid);

              if (viewport.shouldLoadBottom() && keepFetching) {
                // keepFetching = true means that at least one item app/prepended in the last batch had height > 0
                enqueueFetch(rid, true);
              } else if (viewport.shouldLoadTop() && (keepFetching || pending[0])) {
                // pending[0] = true means that previous fetch was appending. We need to force at least one prepend
                // BTW there will always be at least 1 element in the pending array because bottom is fetched first
                enqueueFetch(rid, false);
              }

              pending.shift();

              if (!pending.length) {
                adapter.loading(false);
                bindEvents();
                return adapter.calculateProperties();
              }

              return fetch(rid);
            });
          }

          function fetch(rid) {
            if (pending[0]) {// scrolling down
              if (buffer.length && !viewport.shouldLoadBottom()) {
                return adjustBufferAfterFetch(rid);
              }

              return fetchNext((result) => {
                if ((rid && rid !== ridActual) || $scope.$$destroyed) {
                  return;
                }

                if (result.length < bufferSize) {
                  buffer.eof = true;
                  // log 'eof is reached'
                }

                if (result.length > 0) {
                  viewport.clipTop();
                  buffer.append(result);
                }

                buffer.setUpper();

                return adjustBufferAfterFetch(rid);
              });
            }

            // scrolling up
            if (buffer.length && !viewport.shouldLoadTop()) {
              return adjustBufferAfterFetch(rid);
            }

            return fetchPrevious((result) => {
              if ((rid && rid !== ridActual) || $scope.$$destroyed) {
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

              buffer.setLower();

              return adjustBufferAfterFetch(rid);
            });
          }

          function resizeAndScrollHandler() {
            if (!$rootScope.$$phase && !adapter.isLoading) {
              adapter.sCount++;
              if (viewport.shouldLoadBottom()) {
                enqueueFetch(ridActual, true);
              } else if (viewport.shouldLoadTop()) {
                enqueueFetch(ridActual, false);
              }

              if (pending.length) {
                unbindEvents();
              } else {
                adapter.calculateProperties();
                $scope.$apply();
              }
            }
          }

          function wheelHandler(event) {
            let scrollTop = viewport[0].scrollTop;
            let yMax = viewport[0].scrollHeight - viewport[0].clientHeight;

            if ((scrollTop === 0 && !buffer.bof) || (scrollTop === yMax && !buffer.eof)) {
              event.preventDefault();
            }
          }
        };
      }
    }
  ]);
