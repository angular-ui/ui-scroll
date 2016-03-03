/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.3.3 -- 2016-03-02T14:14:07.987Z
 * License: MIT
 */
 

 (function () {
'use strict';

var _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol ? 'symbol' : typeof obj; };

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
angular.module('ui.scroll', []).directive('uiScrollViewport', function () {
  return {
    controller: ['$scope', '$element', function (scope, element) {
      this.viewport = element;
      return this;
    }]
  };
}).directive('uiScroll', ['$log', '$injector', '$rootScope', '$timeout', '$q', '$parse', function (console, $injector, $rootScope, $timeout, $q, $parse) {
  var $animate = $injector.has && $injector.has('$animate') ? $injector.get('$animate') : null;
  var isAngularVersionLessThen1_3 = angular.version.major === 1 && angular.version.minor < 3;
  //const log = console.debug || console.log;

  return {
    require: ['?^uiScrollViewport'],
    transclude: 'element',
    priority: 1000,
    terminal: true,
    compile: compile
  };

  // Element manipulation routines
  function _insertElement(newElement, previousElement) {
    previousElement.after(newElement);
    return [];
  }

  function removeElement(wrapper) {
    wrapper.element.remove();
    wrapper.scope.$destroy();
    return [];
  }

  function _insertElementAnimated(newElement, previousElement) {
    if (!$animate) {
      return _insertElement(newElement, previousElement);
    }

    if (isAngularVersionLessThen1_3) {
      var _ret = function () {
        var deferred = $q.defer();
        // no need for parent - previous element is never null
        $animate.enter(newElement, null, previousElement, function () {
          return deferred.resolve();
        });

        return {
          v: [deferred.promise]
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === 'object') return _ret.v;
    }

    // no need for parent - previous element is never null
    return [$animate.enter(newElement, null, previousElement)];
  }

  function removeElementAnimated(wrapper) {
    if (!$animate) {
      return removeElement(wrapper);
    }

    if (isAngularVersionLessThen1_3) {
      var _ret2 = function () {
        var deferred = $q.defer();
        $animate.leave(wrapper.element, function () {
          wrapper.scope.$destroy();
          return deferred.resolve();
        });

        return {
          v: [deferred.promise]
        };
      }();

      if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === 'object') return _ret2.v;
    }

    return [$animate.leave(wrapper.element).then(function () {
      return wrapper.scope.$destroy();
    })];
  }

  function Buffer(itemName, $scope, linker, bufferSize) {
    var buffer = Object.create(Array.prototype);

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

      append: function append(items) {
        items.forEach(function (item) {
          ++buffer.next;
          buffer.insert('append', item);
        });
      },
      prepend: function prepend(items) {
        items.reverse().forEach(function (item) {
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
      insert: function insert(operation, item) {
        var itemScope = $scope.$new();
        var wrapper = {
          item: item,
          scope: itemScope
        };

        itemScope[itemName] = item;

        linker(itemScope, function (clone) {
          return wrapper.element = clone;
        });

        if (operation % 1 === 0) {
          // it is an insert
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
      remove: function remove(arg1, arg2) {
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
      setUpper: function setUpper() {
        buffer.maxIndex = buffer.eof ? buffer.next - 1 : Math.max(buffer.next - 1, buffer.maxIndex);
      },
      setLower: function setLower() {
        buffer.minIndex = buffer.bof ? buffer.minIndex = buffer.first : Math.min(buffer.first, buffer.minIndex);
      },
      syncDatasource: function syncDatasource(datasource) {
        var offset = buffer.minIndex - Math.min(buffer.minIndex, datasource.minIndex || Number.MAX_VALUE);

        datasource.minIndex = buffer.minIndex -= offset;
        datasource.maxIndex = buffer.maxIndex = Math.max(buffer.maxIndex, datasource.maxIndex || Number.MIN_VALUE);

        return offset;
      },


      // clears the buffer
      clear: function clear() {
        buffer.remove(0, buffer.length);
        arguments.length ? reset(arguments[0]) : reset(1);
      }
    });

    reset(1);

    return buffer;
  }

  function Padding(template) {
    var result = undefined;
    var tagName = template.localName;

    switch (tagName) {
      case 'dl':
        throw new Error('ui-scroll directive does not support <' + tagName + '> as a repeating tag: ' + template.outerHTML);
      case 'tr':
        var table = angular.element('<table><tr><td><div></div></td></tr></table>');
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

  function Viewport(buffer, element, controllers, attrs) {
    var topPadding = null;
    var bottomPadding = null;
    var averageItemHeight = 0;
    var viewport = controllers[0] && controllers[0].viewport ? controllers[0].viewport : angular.element(window);

    viewport.css({
      'overflow-y': 'auto',
      'display': 'block'
    });

    var viewportOffset = viewport.offset() ? function () {
      return viewport.offset();
    } : function () {
      return { top: 0 };
    };

    function bufferPadding() {
      return viewport.outerHeight() * Math.max(0.1, +attrs.padding || 0.1); // some extra space to initiate preload
    }

    angular.extend(viewport, {
      createPaddingElements: function createPaddingElements(template) {
        topPadding = new Padding(template);
        bottomPadding = new Padding(template);
        element.before(topPadding);
        element.after(bottomPadding);
      },
      bottomDataPos: function bottomDataPos() {
        var scrollHeight = viewport[0].scrollHeight;
        scrollHeight = scrollHeight !== null ? scrollHeight : viewport[0].document.documentElement.scrollHeight;

        return scrollHeight - bottomPadding.height();
      },
      topDataPos: function topDataPos() {
        return topPadding.height();
      },
      bottomVisiblePos: function bottomVisiblePos() {
        return viewport.scrollTop() + viewport.outerHeight();
      },
      topVisiblePos: function topVisiblePos() {
        return viewport.scrollTop();
      },
      insertElement: function insertElement(e, sibling) {
        return _insertElement(e, sibling || topPadding);
      },
      insertElementAnimated: function insertElementAnimated(e, sibling) {
        return _insertElementAnimated(e, sibling || topPadding);
      },
      shouldLoadBottom: function shouldLoadBottom() {
        return !buffer.eof && viewport.bottomDataPos() < viewport.bottomVisiblePos() + bufferPadding();
      },
      clipBottom: function clipBottom() {
        // clip the invisible items off the bottom
        var overage = 0;

        for (var i = buffer.length - 1; i >= 0; i--) {
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
      shouldLoadTop: function shouldLoadTop() {
        return !buffer.bof && viewport.topDataPos() > viewport.topVisiblePos() - bufferPadding();
      },
      clipTop: function clipTop() {
        // clip the invisible items off the top
        var overage = 0;
        var overageHeight = 0;

        for (var i = 0; i < buffer.length; i++) {
          if (buffer[i].element.offset().top - viewportOffset().top + buffer[i].element.outerHeight(true) >= -1 * bufferPadding()) {
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
      adjustPadding: function adjustPadding() {
        if (!buffer.length) {
          return;
        }

        var bufferFirstEl = buffer[0].element;
        var bufferLastEl = buffer[buffer.length - 1].element;

        averageItemHeight = (bufferLastEl.offset().top + bufferLastEl.outerHeight(true) - bufferFirstEl.offset().top) / buffer.length;
        topPadding.height((buffer.first - buffer.minIndex) * averageItemHeight);

        return bottomPadding.height((buffer.maxIndex - buffer.next + 1) * averageItemHeight);
      },
      syncDatasource: function syncDatasource(datasource) {
        if (!buffer.length) {
          return;
        }

        var delta = buffer.syncDatasource(datasource) * averageItemHeight;

        topPadding.height(topPadding.height() + delta);

        viewport.scrollTop(viewport.scrollTop() + delta);

        viewport.adjustPadding();
      },
      adjustScrollTop: function adjustScrollTop(height) {
        var paddingHeight = topPadding.height() - height;

        if (paddingHeight >= 0) {
          topPadding.height(paddingHeight);
        } else {
          topPadding.height(0);
          viewport.scrollTop(viewport.scrollTop() - paddingHeight);
        }
      }
    });

    return viewport;
  }

  function Adapter($attr, viewport, buffer, adjustBuffer) {
    var viewportScope = viewport.scope() || $rootScope;
    var setTopVisible = $attr.topVisible ? $parse($attr.topVisible).assign : angular.noop;
    var setTopVisibleElement = $attr.topVisibleElement ? $parse($attr.topVisibleElement).assign : angular.noop;
    var setTopVisibleScope = $attr.topVisibleScope ? $parse($attr.topVisibleScope).assign : angular.noop;
    var setIsLoading = $attr.isLoading ? $parse($attr.isLoading).assign : angular.noop;

    this.isLoading = false;

    function applyUpdate(wrapper, newItems) {
      if (!angular.isArray(newItems)) {
        return;
      }

      var keepIt = undefined;
      var pos = buffer.indexOf(wrapper) + 1;

      newItems.reverse().forEach(function (newItem) {
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

    this.applyUpdates = function (arg1, arg2) {
      if (angular.isFunction(arg1)) {
        // arg1 is the updater function, arg2 is ignored
        buffer.slice(0).forEach(function (wrapper) {
          // we need to do it on the buffer clone, because buffer content
          // may change as we iterate through
          applyUpdate(wrapper, arg1(wrapper.item, wrapper.scope, wrapper.element));
        });
      } else {
        // arg1 is item index, arg2 is the newItems array
        if (arg1 % 1 !== 0) {
          // checking if it is an integer
          throw new Error('applyUpdates - ' + arg1 + ' is not a valid index');
        }

        var index = arg1 - buffer.first;
        if (index >= 0 && index < buffer.length) {
          applyUpdate(buffer[index], arg2);
        }
      }

      adjustBuffer();
    };

    this.append = function (newItems) {
      buffer.append(newItems);
      adjustBuffer();
    };

    this.prepend = function (newItems) {
      buffer.prepend(newItems);
      adjustBuffer();
    };

    this.loading = function (value) {
      this.isLoading = value;
      setIsLoading(viewportScope, value);
    };

    this.calculateProperties = function () {
      var i = undefined,
          item = undefined,
          itemHeight = undefined,
          itemTop = undefined,
          isNewRow = undefined,
          rowTop = undefined;
      var topHeight = 0;
      for (i = 0; i < buffer.length; i++) {
        item = buffer[i];
        itemTop = item.element.offset().top;
        isNewRow = rowTop !== itemTop;
        rowTop = itemTop;
        if (isNewRow) {
          itemHeight = item.element.outerHeight(true);
        }
        if (isNewRow && viewport.topDataPos() + topHeight + itemHeight <= viewport.topVisiblePos()) {
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
    var match = attr.uiScroll.match(/^\s*(\w+)\s+in\s+([\w\.]+)\s*$/);

    if (!match) {
      throw new Error('Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + attr.uiScroll + '\'');
    }

    var itemName = match[1];
    var datasourceName = match[2];
    var bufferSize = Math.max(3, +attr.bufferSize || 10);

    return function link($scope, element, $attr, controllers, linker) {
      // starting from angular 1.2 compileLinker usage is deprecated
      linker = linker || compileLinker;

      var datasource = function () {
        var _datasource = $parse(datasourceName)($scope);

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
      }();

      var ridActual = 0; // current data revision id
      var pending = [];
      var buffer = new Buffer(itemName, $scope, linker, bufferSize);
      var viewport = new Viewport(buffer, element, controllers, $attr);
      var adapter = new Adapter($attr, viewport, buffer, function () {
        dismissPendingRequests();
        return adjustBuffer(ridActual);
      });

      var fetchNext = function () {
        if (datasource.get.length !== 2) {
          return function (success) {
            return datasource.get(buffer.next, bufferSize, success);
          };
        }

        return function (success) {
          return datasource.get({
            index: buffer.next,
            append: buffer.length ? buffer[buffer.length - 1].item : void 0,
            count: bufferSize
          }, success);
        };
      }();

      var fetchPrevious = function () {
        if (datasource.get.length !== 2) {
          return function (success) {
            return datasource.get(buffer.first - bufferSize, bufferSize, success);
          };
        }

        return function (success) {
          return datasource.get({
            index: buffer.first - bufferSize,
            prepend: buffer.length ? buffer[0].item : void 0,
            count: bufferSize
          }, success);
        };
      }();

      if ($attr.adapter) {
        // so we have an adapter on $scope
        var adapterOnScope = $parse($attr.adapter)($scope);

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
      linker($scope.$new(), function (template, scope) {
        viewport.createPaddingElements(template[0]);
        // Destroy template's scope to remove any watchers on it.
        scope.$destroy();
        // also remove the template when the directive scope is destroyed
        $scope.$on('$destroy', function () {
          return template.remove();
        });
      });

      adapter.reload = reload;

      // events and bindings
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
        viewport.unbind('mousewheel', wheelHandler);
      });

      function dismissPendingRequests() {
        ridActual++;
        pending = [];
      }

      function reload() {
        dismissPendingRequests();

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

        buffer.forEach(function (item) {
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

        wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch(function () {
          return visibilityWatcher(wrapper);
        });

        return false;
      }

      function processBufferedItems(rid) {
        var keepFetching = false;
        var promises = [];
        var toBePrepended = [];
        var toBeRemoved = [];

        function getPreSibling(i) {
          return i > 0 ? buffer[i - 1].element : undefined;
        }

        buffer.forEach(function (wrapper, i) {
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

        toBeRemoved.forEach(function (wrapper) {
          return promises = promises.concat(buffer.remove(wrapper));
        });

        if (toBePrepended.length) {
          var adjustedPaddingHeight = 0;

          toBePrepended.forEach(function (wrapper) {
            keepFetching = insertWrapperContent(wrapper) || keepFetching;
            wrapper.op = 'none';
            adjustedPaddingHeight += wrapper.element.outerHeight(true);
          });

          viewport.adjustScrollTop(adjustedPaddingHeight);
        }

        // re-index the buffer
        buffer.forEach(function (item, i) {
          return item.scope.$index = buffer.first + i;
        });

        // schedule another adjustBuffer after animation completion
        if (promises.length) {
          $q.all(promises).then(function () {
            viewport.adjustPadding();
            // log 'Animation completed rid #{rid}'
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
        return $timeout(function () {
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
        return $timeout(function () {
          var keepFetching = processBufferedItems(rid);

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
            return adapter.calculateProperties();
          }

          return fetch(rid);
        });
      }

      function fetch(rid) {
        if (pending[0]) {
          // scrolling down
          if (buffer.length && !viewport.shouldLoadBottom()) {
            return adjustBufferAfterFetch(rid);
          }

          return fetchNext(function (result) {
            if (rid && rid !== ridActual || $scope.$$destroyed) {
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

        return fetchPrevious(function (result) {
          if (rid && rid !== ridActual || $scope.$$destroyed) {
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
          adjustBuffer();
        }
      }

      function wheelHandler(event) {
        var scrollTop = viewport[0].scrollTop;
        var yMax = viewport[0].scrollHeight - viewport[0].clientHeight;

        if (scrollTop === 0 && !buffer.bof || scrollTop === yMax && !buffer.eof) {
          event.preventDefault();
        }
      }

      // update events (deprecated since v1.1.0, unsupported since 1.2.0)
      (function () {
        var eventListener = datasource.scope ? datasource.scope.$new() : $scope.$new();

        eventListener.$on('insert.item', function () {
          return unsupportedMethod('insert');
        });

        eventListener.$on('update.items', function () {
          return unsupportedMethod('update');
        });

        eventListener.$on('delete.items', function () {
          return unsupportedMethod('delete');
        });

        function unsupportedMethod(token) {
          throw new Error(token + ' event is no longer supported - use applyUpdates instead');
        }
      })();
    };
  }
}]);
}());