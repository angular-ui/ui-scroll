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
          return buffer.maxIndex = Number.MIN_VALUE;
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
              for (var i = arg1; i < arg2; i++) {
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

      function Padding(template) {
        var div, result, table, tagName;
        tagName = template.localName;

        if (tagName === 'dl') {
          throw new Error('ui-scroll directive does not support <' + tagName + '> as a repeating tag: ' + template.outerHTML);
        }

        if (tagName !== 'li' && tagName !== 'tr') {
          tagName = 'div';
        }

        switch (tagName) {
          case 'tr':
            table = angular.element('<table><tr><td><div></div></td></tr></table>');
            div = table.find('div');
            result = table.find('tr');
            break;
          default:
            result = angular.element('<' + tagName + '></' + tagName + '>');
        }

        return result;
      }

      function Viewport(buffer, element, controllers, attrs) {
        var averageItemHeight, bottomPadding, bufferPadding, topPadding, viewport, viewportOffset;

        viewport = controllers[0] && controllers[0].viewport ? controllers[0].viewport : angular.element(window);
        viewport.css({
          'overflow-y': 'auto',
          'display': 'block'
        });
        topPadding = null;
        bottomPadding = null;
        averageItemHeight = 0;

        bufferPadding = function () {
          return viewport.outerHeight() * Math.max(0.1, +attrs.padding || 0.1); // some extra space to initiate preload
        };

        viewport.createPaddingElements = function (template) {
          topPadding = new Padding(template);
          bottomPadding = new Padding(template);
          element.before(topPadding);
          return element.after(bottomPadding);
        };

        viewport.bottomDataPos = function () {
          var ref;
          return ((ref = viewport[0].scrollHeight) != null ? ref : viewport[0].document.documentElement.scrollHeight) - bottomPadding.height();
        };

        viewport.topDataPos = function () {
          return topPadding.height();
        };

        viewport.bottomVisiblePos = function () {
          return viewport.scrollTop() + viewport.outerHeight();
        };

        viewport.topVisiblePos = function () {
          return viewport.scrollTop();
        };

        viewport.insertElement = function (e, sibling) {
          return insertElement(e, sibling || topPadding);
        };

        viewport.insertElementAnimated = function (e, sibling) {
          return insertElementAnimated(e, sibling || topPadding);
        };

        viewport.shouldLoadBottom = function () {
          return !buffer.eof && viewport.bottomDataPos() < viewport.bottomVisiblePos() + bufferPadding();
        };

        viewportOffset = viewport.offset() ? function () {
          return viewport.offset();
        } : function () {
          return {
            top: 0
          };
        };

        viewport.clipBottom = function () {
          // clip the invisible items off the bottom
          var i, item, j, overage, ref;
          overage = 0;
          for (i = j = ref = buffer.length - 1; ref <= 0 ? j <= 0 : j >= 0; i = ref <= 0 ? ++j : --j) {
            item = buffer[i];
            if (item.element.offset().top - viewportOffset().top > viewport.outerHeight() + bufferPadding()) {
              overage++;
            } else {
              break;
            }
          }
          if (overage > 0) {
            buffer.eof = false;
            buffer.remove(buffer.length - overage, buffer.length);
            buffer.next -= overage;
            return viewport.adjustPadding();
          }
        };

        viewport.shouldLoadTop = function () {
          return !buffer.bof && (viewport.topDataPos() > viewport.topVisiblePos() - bufferPadding());
        };

        viewport.clipTop = function () {
          // clip the invisible items off the top
          var item, j, len, overage, overageHeight;
          overage = 0;
          overageHeight = 0;
          for (j = 0, len = buffer.length; j < len; j++) {
            item = buffer[j];
            if (item.element.offset().top - viewportOffset().top + item.element.outerHeight(true) < (-1) * bufferPadding()) {
              overageHeight += item.element.outerHeight(true);
              overage++;
            } else {
              break;
            }
          }
          if (overage > 0) {
            // we need to adjust top padding element before items are removed from top
            // to avoid strange behaviour of scroll bar during remove top items when we are at the very bottom
            topPadding.height(topPadding.height() + overageHeight);
            buffer.bof = false;
            buffer.remove(0, overage);
            return buffer.first += overage;
          }
        };

        viewport.adjustPadding = function () {
          if (!buffer.length) {
            return;
          }
          averageItemHeight = (buffer[buffer.length - 1].element.offset().top + buffer[buffer.length - 1].element.outerHeight(true) - buffer[0].element.offset().top) / buffer.length;
          topPadding.height((buffer.first - buffer.minIndex) * averageItemHeight);
          return bottomPadding.height((buffer.maxIndex - buffer.next + 1) * averageItemHeight);
        };

        viewport.syncDatasource = function (datasource) {
          var delta;
          if (!buffer.length) {
            return;
          }
          delta = buffer.syncDatasource(datasource) * averageItemHeight;
          topPadding.height(topPadding.height() + delta);
          viewport.scrollTop(viewport.scrollTop() + delta);
          return viewport.adjustPadding();
        };

        viewport.adjustScrollTop = function (height) {
          var paddingHeight;
          paddingHeight = topPadding.height() - height;
          if (paddingHeight >= 0) {
            return topPadding.height(paddingHeight);
          } else {
            topPadding.height(0);
            return viewport.scrollTop(viewport.scrollTop() - paddingHeight);
          }
        };
        return viewport;
      }

      function Adapter($attr, viewport, buffer, adjustBuffer) {
        var applyUpdate, setIsLoading, setTopVisible, setTopVisibleElement, setTopVisibleScope, viewportScope;
        this.isLoading = false;

        viewportScope = viewport.scope() || $rootScope;

        applyUpdate = function (wrapper, newItems) {
          var i, j, keepIt, len, newItem, pos, ref;
          if (angular.isArray(newItems)) {
            pos = (buffer.indexOf(wrapper)) + 1;
            ref = newItems.reverse();
            for (i = j = 0, len = ref.length; j < len; i = ++j) {
              newItem = ref[i];
              if (newItem === wrapper.item) {
                keepIt = true;
                pos--;
              } else {
                buffer.insert(pos, newItem);
              }
            }
            if (!keepIt) {
              return wrapper.op = 'remove';
            }
          }
        };

        this.applyUpdates = function (arg1, arg2) {
          var bufferClone, i, j, len, ref, wrapper;
          if (angular.isFunction(arg1)) {
            // arg1 is the updater function, arg2 is ignored
            bufferClone = buffer.slice(0);
            for (i = j = 0, len = bufferClone.length; j < len; i = ++j) {
              // we need to do it on the buffer clone, because buffer content
              // may change as we iterate through
              wrapper = bufferClone[i];
              applyUpdate(wrapper, arg1(wrapper.item, wrapper.scope, wrapper.element));
            }
          } else {
            // arg1 is item index, arg2 is the newItems array
            if (arg1 % 1 === 0) {// checking if it is an integer
              if ((0 <= (ref = arg1 - buffer.first) && ref < buffer.length)) {
                applyUpdate(buffer[arg1 - buffer.first], arg2);
              }
            } else {
              throw new Error('applyUpdates - ' + arg1 + ' is not a valid index');
            }
          }
          return adjustBuffer();
        };

        this.append = function (newItems) {
          buffer.append(newItems);
          return adjustBuffer();
        };

        this.prepend = function (newItems) {
          buffer.prepend(newItems);
          return adjustBuffer();
        };

        setTopVisible = $attr.topVisible ? $parse($attr.topVisible).assign : function () {
        };
        setTopVisibleElement = $attr.topVisibleElement ? $parse($attr.topVisibleElement).assign : function () {
        };
        setTopVisibleScope = $attr.topVisibleScope ? $parse($attr.topVisibleScope).assign : function () {
        };
        setIsLoading = $attr.isLoading ? $parse($attr.isLoading).assign : function () {
        };

        this.loading = function (value) {
          this.isLoading = value;
          return setIsLoading(viewportScope, value);
        };

        this.calculateProperties = function () {
          var item, itemHeight, itemTop, j, len, newRow, results, rowTop, topHeight;
          topHeight = 0;
          results = [];
          for (j = 0, len = buffer.length; j < len; j++) {
            item = buffer[j];
            itemTop = item.element.offset().top;
            newRow = rowTop !== itemTop;
            rowTop = itemTop;
            if (newRow) {
              itemHeight = item.element.outerHeight(true);
            }
            if (newRow && (viewport.topDataPos() + topHeight + itemHeight <= viewport.topVisiblePos())) {
              results.push(topHeight += itemHeight);
            } else {
              if (newRow) {
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
          return results;
        };
      }

      function compile(elementTemplate, attr, compileLinker) {
        var bufferSize, datasourceName, itemName, match;

        if (!(match = attr.uiScroll.match(/^\s*(\w+)\s+in\s+([\w\.]+)\s*$/))) {
          throw new Error('Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + attr.uiScroll + '\'');
        }

        itemName = match[1];
        datasourceName = match[2];
        bufferSize = Math.max(3, +attr.bufferSize || 10);

        return function ($scope, element, $attr, controllers, linker) {
          var adapter, adapterOnScope, adjustBuffer, adjustBufferAfterFetch, buffer, datasource, dismissPendingRequests, enqueueFetch, eventListener, fetch, fetchNext, fetchPrevious, insertWrapperContent, isDatasourceValid, isElementVisible, pending, processBufferedItems, reload, resizeAndScrollHandler, ridActual, unsupportedMethod, viewport, visibilityWatcher, wheelHandler;

          // starting from angular 1.2 compileLinker usage is deprecated
          linker = linker || compileLinker;

          datasource = $parse(datasourceName)($scope);

          isDatasourceValid = function () {
            // then try to inject datasource as service
            return angular.isObject(datasource) && angular.isFunction(datasource.get);
          };

          if (!isDatasourceValid()) {
            datasource = $injector.get(datasourceName);
            if (!isDatasourceValid()) {
              throw new Error(datasourceName + ' is not a valid datasource');
            }
          }
          ridActual = 0;// current data revision id
          pending = [];
          buffer = new Buffer(itemName, $scope, linker, bufferSize);
          viewport = new Viewport(buffer, element, controllers, $attr);
          adapter = new Adapter($attr, viewport, buffer, function () {
            dismissPendingRequests();
            return adjustBuffer(ridActual);
          });

          if ($attr.adapter) {
            // so we have an adapter on $scope
            adapterOnScope = $parse($attr.adapter)($scope);
            if (!angular.isObject(adapterOnScope)) {
              $parse($attr.adapter).assign($scope, {});
              adapterOnScope = $parse($attr.adapter)($scope);
            }
            angular.extend(adapterOnScope, adapter);
            adapter = adapterOnScope;
          }

          /**
           * Build padding elements
           *
           * Calling linker is the only way I found to get access to the tag name of the template
           * to prevent the directive scope from pollution a new scope is created and destroyed
           * right after the builder creation is completed
           */
          linker($scope.$new(), function (template, scope) {
            viewport.createPaddingElements(template[0]);
            // Destroy template's scope to remove any watchers on it.
            scope.$destroy();
            // also remove the template when the directive scope is destroyed
            return $scope.$on('$destroy', function () {
              return template.remove();
            });
          });

          dismissPendingRequests = function () {
            ridActual++;
            return pending = [];
          };

          reload = function () {
            dismissPendingRequests();
            if (arguments.length) {
              buffer.clear(arguments[0]);
            } else {
              buffer.clear();
            }
            return adjustBuffer(ridActual);
          };

          adapter.reload = reload;

          enqueueFetch = function (rid, direction) {
            if (!adapter.isLoading) {
              adapter.loading(true);
            }
            if (pending.push(direction) === 1) {
              return fetch(rid);
            }
          };

          isElementVisible = function (wrapper) {
            return wrapper.element.height() && wrapper.element[0].offsetParent;
          };

          visibilityWatcher = function (wrapper) {
            var item, j, len;
            if (isElementVisible(wrapper)) {
              for (j = 0, len = buffer.length; j < len; j++) {
                item = buffer[j];
                if (angular.isFunction(item.unregisterVisibilityWatcher)) {
                  item.unregisterVisibilityWatcher();
                  delete item.unregisterVisibilityWatcher;
                }
              }
              return adjustBuffer();
            }
          };

          insertWrapperContent = function (wrapper, sibling) {
            viewport.insertElement(wrapper.element, sibling);
            if (isElementVisible(wrapper)) {
              return true;
            }
            wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch(function () {
              return visibilityWatcher(wrapper);
            });
            return false;
          };

          processBufferedItems = function (rid) {
            var adjustedPaddingHeight, getPreSibling, i, item, j, k, keepFetching, l, len, len1, len2, len3, m, promises, toBePrepended, toBeRemoved, wrapper;
            promises = [];
            toBePrepended = [];
            toBeRemoved = [];

            getPreSibling = function (i) {
              if (i > 0) {
                return buffer[i - 1].element;
              } else {
                return void 0;
              }
            };

            for (i = j = 0, len = buffer.length; j < len; i = ++j) {
              wrapper = buffer[i];
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
            }
            for (k = 0, len1 = toBeRemoved.length; k < len1; k++) {
              wrapper = toBeRemoved[k];
              promises = promises.concat(buffer.remove(wrapper));
            }

            if (toBePrepended.length) {
              adjustedPaddingHeight = 0;
              for (l = 0, len2 = toBePrepended.length; l < len2; l++) {
                wrapper = toBePrepended[l];
                keepFetching = insertWrapperContent(wrapper) || keepFetching;
                wrapper.op = 'none';
                adjustedPaddingHeight += wrapper.element.outerHeight(true);
              }
              viewport.adjustScrollTop(adjustedPaddingHeight);
            }

            // re-index the buffer
            for (i = m = 0, len3 = buffer.length; m < len3; i = ++m) {
              item = buffer[i];
              item.scope.$index = buffer.first + i;
            }

            // schedule another adjustBuffer after animation completion
            if (promises.length) {
              $q.all(promises).then(function () {
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
          };

          adjustBuffer = function (rid) {
            // We need the item bindings to be processed before we can do adjustment
            return $timeout(function () {
              processBufferedItems(rid);
              if (viewport.shouldLoadBottom()) {
                enqueueFetch(rid, true);
              } else {
                if (viewport.shouldLoadTop()) {
                  enqueueFetch(rid, false);
                }
              }
              if (!pending.length) {
                return adapter.calculateProperties();
              }
            });
          };

          adjustBufferAfterFetch = function (rid) {
            // We need the item bindings to be processed before we can do adjustment
            return $timeout(function () {
              var keepFetching;
              keepFetching = processBufferedItems(rid);
              if (viewport.shouldLoadBottom()) {
                // keepFetching = true means that at least one item app/prepended in the last batch had height > 0
                if (keepFetching) {
                  enqueueFetch(rid, true);
                }
              } else {
                if (viewport.shouldLoadTop()) {
                  // pending[0] = true means that previous fetch was appending. We need to force at least one prepend
                  // BTW there will always be at least 1 element in the pending array because bottom is fetched first
                  if (keepFetching || pending[0]) {
                    enqueueFetch(rid, false);
                  }
                }
              }
              pending.shift();
              if (!pending.length) {
                adapter.loading(false);
                return adapter.calculateProperties();
              } else {
                return fetch(rid);
              }
            });
          };

          if (datasource.get.length === 2) {
            fetchNext = function (success) {
              return datasource.get({
                index: buffer.next,
                append: buffer.length ? buffer[buffer.length - 1].item : void 0,
                count: bufferSize
              }, success);
            };

            fetchPrevious = function (success) {
              return datasource.get({
                index: buffer.first - bufferSize,
                prepend: buffer.length ? buffer[0].item : void 0,
                count: bufferSize
              }, success);
            };
          } else {
            fetchNext = function (success) {
              return datasource.get(buffer.next, bufferSize, success);
            };

            fetchPrevious = function (success) {
              return datasource.get(buffer.first - bufferSize, bufferSize, success);
            };
          }

          fetch = function (rid) {
            if (pending[0]) {// scrolling down
              if (buffer.length && !viewport.shouldLoadBottom()) {
                return adjustBufferAfterFetch(rid);
              } else {
                return fetchNext(function (result) {
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
            } else {
              if (buffer.length && !viewport.shouldLoadTop()) {
                return adjustBufferAfterFetch(rid);
              } else {
                return fetchPrevious(function (result) {
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
            }
          };

          // events and bindings

          resizeAndScrollHandler = function () {
            if (!$rootScope.$$phase && !adapter.isLoading) {
              adjustBuffer();
              return $scope.$apply();
            }
          };

          wheelHandler = function (event) {
            var scrollTop, yMax;
            scrollTop = viewport[0].scrollTop;
            yMax = viewport[0].scrollHeight - viewport[0].clientHeight;
            if ((scrollTop === 0 && !buffer.bof) || (scrollTop === yMax && !buffer.eof)) {
              return event.preventDefault();
            }
          };

          viewport.bind('resize', resizeAndScrollHandler);
          viewport.bind('scroll', resizeAndScrollHandler);
          viewport.bind('mousewheel', wheelHandler);

          $scope.$watch(datasource.revision, function () {
            return reload();
          });

          $scope.$on('$destroy', function () {
            // clear the buffer. It is necessary to remove the elements and $destroy the scopes
            buffer.clear();
            viewport.unbind('resize', resizeAndScrollHandler);
            viewport.unbind('scroll', resizeAndScrollHandler);
            return viewport.unbind('mousewheel', wheelHandler);
          });

          // update events (deprecated since v1.1.0, unsupported since 1.2.0)

          unsupportedMethod = function (token) {
            throw new Error(token + ' event is no longer supported - use applyUpdates instead');
          };
          eventListener = datasource.scope ? datasource.scope.$new() : $scope.$new();
          eventListener.$on('insert.item', function () {
            return unsupportedMethod('insert');
          });
          eventListener.$on('update.items', function () {
            return unsupportedMethod('update');
          });
          return eventListener.$on('delete.items', function () {
            return unsupportedMethod('delete');
          });
        };
      }
    }
  ]);
