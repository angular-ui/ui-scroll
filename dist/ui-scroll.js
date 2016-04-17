/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.4.1 -- 2016-04-17T11:47:46.064Z
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

    angular.extend(buffer, {
      size: bufferSize,

      reset: function reset(startIndex) {
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
      }
    });

    return buffer;
  }

  function Viewport(buffer, element, controllers, attrs) {
    var PADDING_MIN = 0.3;
    var PADDING_DEFAULT = 0.5;
    var topPadding = null;
    var bottomPadding = null;
    var viewport = controllers[0] && controllers[0].viewport ? controllers[0].viewport : angular.element(window);

    viewport.css({
      'overflow-y': 'auto',
      'display': 'block'
    });

    function Cache() {
      var cache = Object.create(Array.prototype);

      angular.extend(cache, {
        add: function add(item) {
          for (var i = cache.length - 1; i >= 0; i--) {
            if (cache[i].index === item.scope.$index) {
              cache[i].height = item.element.outerHeight();
              return;
            }
          }
          cache.push({
            index: item.scope.$index,
            height: item.element.outerHeight()
          });
        },
        clear: function clear() {
          cache.length = 0;
        }
      });

      return cache;
    }

    function Padding(template) {
      var result = undefined;

      switch (template.tagName) {
        case 'dl':
          throw new Error('ui-scroll directive does not support <' + template.tagName + '> as a repeating tag: ' + template.outerHTML);
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

      result.cache = new Cache();

      return result;
    }

    function bufferPadding() {
      return viewport.outerHeight() * Math.max(PADDING_MIN, +attrs.padding || PADDING_DEFAULT); // some extra space to initiate preload
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
        scrollHeight = scrollHeight != null ? scrollHeight : viewport[0].document.documentElement.scrollHeight;
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
        var overageHeight = 0;
        var itemHeight = 0;
        var emptySpaceHeight = viewport.bottomDataPos() - viewport.bottomVisiblePos() - bufferPadding();

        for (var i = buffer.length - 1; i >= 0; i--) {
          itemHeight = buffer[i].element.outerHeight(true);
          if (overageHeight + itemHeight > emptySpaceHeight) {
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
      shouldLoadTop: function shouldLoadTop() {
        return !buffer.bof && viewport.topDataPos() > viewport.topVisiblePos() - bufferPadding();
      },
      clipTop: function clipTop() {
        // clip the invisible items off the top
        var overage = 0;
        var overageHeight = 0;
        var itemHeight = 0;
        var emptySpaceHeight = viewport.topVisiblePos() - viewport.topDataPos() - bufferPadding();

        for (var i = 0; i < buffer.length; i++) {
          itemHeight = buffer[i].element.outerHeight(true);
          if (overageHeight + itemHeight > emptySpaceHeight) {
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
      adjustPadding: function adjustPadding(adjustScrollTop) {
        if (!buffer.length) {
          return;
        }

        // percise heights calculation, items that were in buffer once
        var topPaddingHeight = 0;
        var bottomPaddingHeight = 0;

        if (topPadding.cache.length) {
          for (var i = topPadding.cache.length - 1; i >= 0; i--) {
            if (topPadding.cache[i].index < buffer.first) {
              topPaddingHeight += topPadding.cache[i].height;
            }
          }
        }
        if (bottomPadding.cache.length) {
          for (var i = bottomPadding.cache.length - 1; i >= 0; i--) {
            if (bottomPadding.cache[i].index >= buffer.next) {
              bottomPaddingHeight += bottomPadding.cache[i].height;
            }
          }
        }

        // average heights calculation, items that have never been reached
        var topPaddingHeightAdd = 0;
        var bottomPaddingHeightAdd = 0;
        var adjustTopPadding = buffer.minIndexUser && buffer.minIndex > buffer.minIndexUser;
        var adjustBottomPadding = buffer.maxIndexUser && buffer.maxIndex < buffer.maxIndexUser;

        if (adjustTopPadding || adjustBottomPadding) {
          var visibleItemsHeight = 0;
          for (var i = buffer.length - 1; i >= 0; i--) {
            visibleItemsHeight += buffer[i].element.outerHeight(true);
          }
          var averageItemHeight = (visibleItemsHeight + topPaddingHeight + bottomPaddingHeight) / (buffer.maxIndex - buffer.minIndex + 1);
          topPaddingHeightAdd = adjustTopPadding ? (buffer.minIndex - buffer.minIndexUser) * averageItemHeight : 0;
          bottomPaddingHeightAdd = adjustBottomPadding ? (buffer.maxIndexUser - buffer.maxIndex) * averageItemHeight : 0;
        }

        // paddings combine adjustement
        var topPaddingHeightOld = topPadding.height();
        topPadding.height(topPaddingHeight + topPaddingHeightAdd);
        bottomPadding.height(bottomPaddingHeight + bottomPaddingHeightAdd);

        // additional scrollTop adjustement in case of datasource.minIndex external set
        if (adjustScrollTop && adjustTopPadding && topPaddingHeightAdd) {
          var diff = topPadding.height() - topPaddingHeightOld;
          viewport.scrollTop(viewport.scrollTop() + diff);
        }
      },
      adjustScrollTopAfterPrepend: function adjustScrollTopAfterPrepend(height) {
        var paddingHeight = topPadding.height() - height;

        if (paddingHeight >= 0) {
          topPadding.height(paddingHeight);
        } else {
          topPadding.height(0);
          viewport.scrollTop(viewport.scrollTop() - paddingHeight);
        }
      },
      resetTopPadding: function resetTopPadding() {
        topPadding.height(0);
        topPadding.cache.clear();
      },
      resetBottomPadding: function resetBottomPadding() {
        bottomPadding.height(0);
        bottomPadding.cache.clear();
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
    var startIndex = +attr.startIndex || 1;

    return function link($scope, element, $attr, controllers, linker) {
      // starting from angular 1.2 compileLinker usage is deprecated
      linker = linker || compileLinker;

      var datasource = function () {
        var isDatasourceValid = function isDatasourceValid() {
          return angular.isObject(_datasource) && angular.isFunction(_datasource.get);
        };

        var _datasource = $parse(datasourceName)($scope); // try to get datasource on scope
        if (!isDatasourceValid()) {
          _datasource = $injector.get(datasourceName); // try to inject datasource as service
          if (!isDatasourceValid()) {
            throw new Error(datasourceName + ' is not a valid datasource');
          }
        }

        var minIndexDesc = Object.getOwnPropertyDescriptor(_datasource, 'minIndex');
        if (!minIndexDesc || !minIndexDesc.set && !minIndexDesc.get) {
          Object.defineProperty(_datasource, 'minIndex', {
            set: function set(value) {
              this._minIndex = value;
              onDatasourceMinIndexChanged(value);
            },
            get: function get() {
              return this._minIndex;
            }
          });
        }

        var maxIndexDesc = Object.getOwnPropertyDescriptor(_datasource, 'maxIndex');
        if (!maxIndexDesc || !maxIndexDesc.set && !maxIndexDesc.get) {
          Object.defineProperty(_datasource, 'maxIndex', {
            set: function set(value) {
              this._maxIndex = value;
              onDatasourceMaxIndexChanged(value);
            },
            get: function get() {
              return this._maxIndex;
            }
          });
        }

        return _datasource;
      }();

      var ridActual = 0; // current data revision id
      var pending = [];
      var buffer = new Buffer(itemName, $scope, linker, bufferSize);
      var viewport = new Viewport(buffer, element, controllers, $attr);
      var adapter = new Adapter($attr, viewport, buffer, function () {
        dismissPendingRequests();
        adjustBuffer(ridActual);
      });

      var onDatasourceMinIndexChanged = function onDatasourceMinIndexChanged(value) {
        $timeout(function () {
          buffer.minIndexUser = value;
          if (!pending.length) {
            viewport.adjustPadding(true);
          }
        });
      };
      var onDatasourceMaxIndexChanged = function onDatasourceMaxIndexChanged(value) {
        $timeout(function () {
          buffer.maxIndexUser = value;
          if (!pending.length) {
            viewport.adjustPadding();
          }
        });
      };

      var fetchNext = function () {
        if (datasource.get.length !== 2) {
          return function (success) {
            return datasource.get(buffer.next, bufferSize, success);
          };
        }

        return function (success) {
          datasource.get({
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
          datasource.get({
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
        // We don't need template anymore.
        template.remove();
      });

      adapter.reload = reload;

      $scope.$on('$destroy', function () {
        // clear the buffer. It is necessary to remove the elements and $destroy the scopes
        //  *******  buffer.clear(); there is no need to reset the buffer especially because the elements are not destroyed by this anyway
        unbindEvents();
        viewport.unbind('mousewheel', wheelHandler);
      });

      viewport.bind('mousewheel', wheelHandler);

      reload();

      /* Functions definitions */

      function bindEvents() {
        viewport.bind('resize', resizeAndScrollHandler);
        viewport.bind('scroll', resizeAndScrollHandler);
      }

      function unbindEvents() {
        viewport.unbind('resize', resizeAndScrollHandler);
        viewport.unbind('scroll', resizeAndScrollHandler);
      }

      function dismissPendingRequests() {
        ridActual++;
        pending = [];
      }

      function reload() {
        dismissPendingRequests();
        viewport.resetTopPadding();
        viewport.resetBottomPadding();

        if (arguments.length) startIndex = arguments[0];

        buffer.reset(startIndex);
        adjustBuffer(ridActual);
      }

      function isElementVisible(wrapper) {
        return wrapper.element.height() && wrapper.element[0].offsetParent;
      }

      function visibilityWatcher(wrapper) {
        if (isElementVisible(wrapper)) {
          buffer.forEach(function (item) {
            if (angular.isFunction(item.unregisterVisibilityWatcher)) {
              item.unregisterVisibilityWatcher();
              delete item.unregisterVisibilityWatcher;
            }
          });
          adjustBuffer();
        }
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

          viewport.adjustScrollTopAfterPrepend(adjustedPaddingHeight);
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
        }

        return keepFetching;
      }

      function enqueueFetch(rid, keepFetching) {
        if (viewport.shouldLoadBottom() && keepFetching) {
          // keepFetching = true means that at least one item app/prepended in the last batch had height > 0
          if (pending.push(true) === 1) {
            fetch(rid);
            adapter.loading(true);
          }
        } else if (viewport.shouldLoadTop() && (keepFetching || pending[0])) {
          // pending[0] = true means that previous fetch was appending. We need to force at least one prepend
          // BTW there will always be at least 1 element in the pending array because bottom is fetched first
          if (pending.push(false) === 1) {
            fetch(rid);
            adapter.loading(true);
          }
        }
      }

      function adjustBuffer(rid) {
        // We need the item bindings to be processed before we can do adjustment
        $timeout(function () {

          processBufferedItems(rid);
          enqueueFetch(rid, true);

          if (!pending.length) {
            adapter.calculateProperties();
          }
        });
      }

      function adjustBufferAfterFetch(rid) {
        // We need the item bindings to be processed before we can do adjustment
        $timeout(function () {

          enqueueFetch(rid, processBufferedItems(rid));
          pending.shift();

          if (pending.length) fetch(rid);else {
            adapter.loading(false);
            bindEvents();
            adapter.calculateProperties();
          }
        });
      }

      function fetch(rid) {
        if (pending[0]) {
          // scrolling down
          if (buffer.length && !viewport.shouldLoadBottom()) {
            adjustBufferAfterFetch(rid);
          } else {
            fetchNext(function (result) {
              if (rid && rid !== ridActual || $scope.$$destroyed) {
                return;
              }

              if (result.length < bufferSize) {
                buffer.eof = true;
              }

              if (result.length > 0) {
                viewport.clipTop();
                buffer.append(result);
                buffer.setUpper();
              }

              adjustBufferAfterFetch(rid);
            });
          }
        } else {
          // scrolling up
          if (buffer.length && !viewport.shouldLoadTop()) {
            adjustBufferAfterFetch(rid);
          } else {
            fetchPrevious(function (result) {
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
                buffer.setLower();
              }

              adjustBufferAfterFetch(rid);
            });
          }
        }
      }

      function resizeAndScrollHandler() {
        if (!$rootScope.$$phase && !adapter.isLoading) {

          enqueueFetch(ridActual, true);

          if (pending.length) {
            unbindEvents();
          } else {
            adapter.calculateProperties();
            $scope.$apply();
          }
        }
      }

      function wheelHandler(event) {
        var scrollTop = viewport[0].scrollTop;
        var yMax = viewport[0].scrollHeight - viewport[0].clientHeight;

        if (scrollTop === 0 && !buffer.bof || scrollTop === yMax && !buffer.eof) {
          event.preventDefault();
        }
      }
    };
  }
}]);
}());