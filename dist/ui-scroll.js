/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll
 * Version: 1.7.1 -- 2018-04-13T16:09:50.195Z
 * License: MIT
 */
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _jqLiteExtras = __webpack_require__(1);

var _jqLiteExtras2 = _interopRequireDefault(_jqLiteExtras);

var _elementRoutines = __webpack_require__(2);

var _elementRoutines2 = _interopRequireDefault(_elementRoutines);

var _buffer = __webpack_require__(3);

var _buffer2 = _interopRequireDefault(_buffer);

var _viewport = __webpack_require__(4);

var _viewport2 = _interopRequireDefault(_viewport);

var _adapter = __webpack_require__(6);

var _adapter2 = _interopRequireDefault(_adapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

angular.module('ui.scroll', []).constant('JQLiteExtras', _jqLiteExtras2.default).run(['JQLiteExtras', function (JQLiteExtras) {
  !window.jQuery ? new JQLiteExtras().registerFor(angular.element) : null;
  _elementRoutines2.default.addCSSRules();
}]).directive('uiScrollViewport', function () {
  return {
    restrict: 'A',
    controller: ['$scope', '$element', function (scope, element) {
      var _this = this;

      this.container = element;
      this.viewport = element;
      this.scope = scope;

      angular.forEach(element.children(), function (child) {
        if (child.tagName.toLowerCase() === 'tbody') {
          _this.viewport = angular.element(child);
        }
      });

      return this;
    }]
  };
}).directive('uiScroll', ['$log', '$injector', '$rootScope', '$timeout', '$interval', '$q', '$parse', function (console, $injector, $rootScope, $timeout, $interval, $q, $parse) {

  return {
    require: ['?^uiScrollViewport'],
    restrict: 'A',
    transclude: 'element',
    priority: 1000,
    terminal: true,
    link: link
  };

  function link($scope, element, $attr, controllers, linker) {
    var match = $attr.uiScroll.match(/^\s*(\w+)\s+in\s+([(\w|\$)\.]+)\s*$/);
    if (!match) {
      throw new Error('Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + $attr.uiScroll + '\'');
    }

    function parseNumericAttr(value, defaultValue) {
      var result = $parse(value)($scope);
      return isNaN(result) ? defaultValue : result;
    }

    var BUFFER_MIN = 3;
    var BUFFER_DEFAULT = 10;
    var PADDING_MIN = 0.3;
    var PADDING_DEFAULT = 0.5;
    var MAX_VIEWPORT_DELAY = 500;
    var VIEWPORT_POLLING_INTERVAL = 50;

    var datasource = null;
    var itemName = match[1];
    var datasourceName = match[2];
    var viewportController = controllers[0];
    var bufferSize = Math.max(BUFFER_MIN, parseNumericAttr($attr.bufferSize, BUFFER_DEFAULT));
    var padding = Math.max(PADDING_MIN, parseNumericAttr($attr.padding, PADDING_DEFAULT));
    var startIndex = parseNumericAttr($attr.startIndex, 1);
    var ridActual = 0; // current data revision id
    var pending = [];

    var elementRoutines = new _elementRoutines2.default($injector, $q);
    var buffer = new _buffer2.default(elementRoutines, bufferSize, startIndex);
    var viewport = new _viewport2.default(elementRoutines, buffer, element, viewportController, $rootScope, padding);
    var adapter = new _adapter2.default($scope, $parse, $attr, viewport, buffer, doAdjust, reload);

    if (viewportController) {
      viewportController.adapter = adapter;
    }

    var isDatasourceValid = function isDatasourceValid() {
      return Object.prototype.toString.call(datasource) === '[object Object]' && typeof datasource.get === 'function';
    };

    datasource = $parse(datasourceName)($scope); // try to get datasource on scope
    if (!isDatasourceValid()) {
      datasource = $injector.get(datasourceName); // try to inject datasource as service
      if (!isDatasourceValid()) {
        throw new Error(datasourceName + ' is not a valid datasource');
      }
    }

    var onRenderHandlers = [];
    function onRenderHandlersRunner() {
      onRenderHandlers.forEach(function (handler) {
        return handler.run();
      });
      onRenderHandlers = [];
    }
    function persistDatasourceIndex(datasource, propName) {
      var getter = void 0;
      // need to postpone min/maxIndexUser processing if the view is empty
      if (Number.isInteger(datasource[propName])) {
        getter = datasource[propName];
        if (Number.isInteger(getter)) {
          onRenderHandlers = onRenderHandlers.filter(function (handler) {
            return handler.id !== propName;
          });
          onRenderHandlers.push({
            id: propName,
            run: function run() {
              return datasource[propName] = getter;
            }
          });
        }
      }
    }

    function defineDatasourceIndex(datasource, propName, propUserName) {
      var descriptor = Object.getOwnPropertyDescriptor(datasource, propName);
      if (descriptor && (descriptor.set || descriptor.get)) {
        return;
      }
      var getter = void 0;
      persistDatasourceIndex(datasource, propName);
      Object.defineProperty(datasource, propName, {
        set: function set(value) {
          getter = value;
          if (pending.length && !buffer.length) {
            persistDatasourceIndex(datasource, propName);
            return;
          }
          buffer[propUserName] = value;
          var topPaddingHeightOld = viewport.topDataPos();
          viewport.adjustPaddings();
          if (propName === 'minIndex') {
            viewport.onAfterMinIndexSet(topPaddingHeightOld);
          }
        },
        get: function get() {
          return getter;
        }
      });
    }

    defineDatasourceIndex(datasource, 'minIndex', 'minIndexUser');
    defineDatasourceIndex(datasource, 'maxIndex', 'maxIndexUser');

    var fetchNext = datasource.get.length !== 2 ? function (success) {
      return datasource.get(buffer.next, bufferSize, success);
    } : function (success) {
      datasource.get({
        index: buffer.next,
        append: buffer.length ? buffer[buffer.length - 1].item : void 0,
        count: bufferSize
      }, success);
    };

    var fetchPrevious = datasource.get.length !== 2 ? function (success) {
      return datasource.get(buffer.first - bufferSize, bufferSize, success);
    } : function (success) {
      datasource.get({
        index: buffer.first - bufferSize,
        prepend: buffer.length ? buffer[0].item : void 0,
        count: bufferSize
      }, success);
    };

    var initialize = function initialize() {
      var tryCount = 0;
      if (!viewport.applyContainerStyle()) {
        var timer = $interval(function () {
          tryCount++;
          if (viewport.applyContainerStyle()) {
            $interval.cancel(timer);
            doAdjust();
          }
          if (tryCount * VIEWPORT_POLLING_INTERVAL >= MAX_VIEWPORT_DELAY) {
            $interval.cancel(timer);
            throw Error('ui-scroll directive requires a viewport with non-zero height in ' + MAX_VIEWPORT_DELAY + 'ms');
          }
        }, VIEWPORT_POLLING_INTERVAL);
      } else {
        doAdjust();
      }
    };

    /**
     * Build padding elements
     *
     * Calling linker is the only way I found to get access to the tag name of the template
     * to prevent the directive scope from pollution a new scope is created and destroyed
     * right after the builder creation is completed
     */
    linker(function (clone, scope) {
      viewport.createPaddingElements(clone[0]);
      // we do not include the clone in the DOM. It means that the nested directives will not
      // be able to reach the parent directives, but in this case it is intentional because we
      // created the clone to access the template tag name
      scope.$destroy();
      clone.remove();
    });

    $scope.$on('$destroy', function () {
      unbindEvents();
      viewport.unbind('mousewheel', wheelHandler);
    });

    viewport.bind('mousewheel', wheelHandler);

    initialize();

    /* Private function definitions */

    function isInvalid(rid) {
      return rid && rid !== ridActual || $scope.$$destroyed;
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
      if (arguments.length) {
        startIndex = arguments[0];
      }
      buffer.reset(startIndex);
      persistDatasourceIndex(datasource, 'minIndex');
      persistDatasourceIndex(datasource, 'maxIndex');
      doAdjust();
    }

    function isElementVisible(wrapper) {
      return wrapper.element.height() && wrapper.element[0].offsetParent;
    }

    function visibilityWatcher(wrapper) {
      if (isElementVisible(wrapper)) {
        buffer.forEach(function (item) {
          if (typeof item.unregisterVisibilityWatcher === 'function') {
            item.unregisterVisibilityWatcher();
            delete item.unregisterVisibilityWatcher;
          }
        });
        if (!pending.length) {
          $timeout(function () {
            return doAdjust();
          });
        }
      }
    }

    function insertWrapperContent(wrapper, insertAfter) {
      createElement(wrapper, insertAfter, viewport.insertElement);
      if (!isElementVisible(wrapper)) {
        wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch(function () {
          return visibilityWatcher(wrapper);
        });
      }
      elementRoutines.hideElement(wrapper); // hide inserted elements before data binding
    }

    function createElement(wrapper, insertAfter, insertElement) {
      var promises = null;
      var sibling = insertAfter > 0 ? buffer[insertAfter - 1].element : undefined;
      linker(function (clone, scope) {
        promises = insertElement(clone, sibling);
        wrapper.element = clone;
        wrapper.scope = scope;
        scope[itemName] = wrapper.item;
      });
      // ui-scroll-grid apply
      if (adapter.transform) {
        var tdInitializer = wrapper.scope.uiScrollTdInitializer;
        if (tdInitializer && tdInitializer.linking) {
          adapter.transform(wrapper.scope, wrapper.element);
        } else {
          wrapper.scope.uiScrollTdInitializer = {
            onLink: function onLink() {
              return adapter.transform(wrapper.scope, wrapper.element);
            },
            scope: wrapper.scope
          };
        }
      }
      return promises;
    }

    function updateDOM() {
      var promises = [];
      var toBePrepended = [];
      var toBeRemoved = [];
      var inserted = [];

      buffer.forEach(function (wrapper, i) {
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

      toBeRemoved.forEach(function (wrapper) {
        return promises = promises.concat(viewport.removeItem(wrapper));
      });

      if (toBePrepended.length) toBePrepended.forEach(function (wrapper) {
        insertWrapperContent(wrapper);
        wrapper.op = 'none';
      });

      buffer.forEach(function (item, i) {
        return item.scope.$index = buffer.first + i;
      });

      return {
        prepended: toBePrepended,
        removed: toBeRemoved,
        inserted: inserted,
        animated: promises
      };
    }

    function updatePaddings(rid, updates) {
      // schedule another doAdjust after animation completion
      if (updates.animated.length) {
        $q.all(updates.animated).then(function () {
          viewport.adjustPaddings();
          doAdjust(rid);
        });
      } else {
        viewport.adjustPaddings();
      }
    }

    function enqueueFetch(rid, updates) {
      if (viewport.shouldLoadBottom()) {
        if (!updates || buffer.effectiveHeight(updates.inserted) > 0) {
          // this means that at least one item appended in the last batch has height > 0
          if (pending.push(true) === 1) {
            adapter.loading(true);
            fetch(rid);
          }
        }
      } else if (viewport.shouldLoadTop()) {
        if (!updates || buffer.effectiveHeight(updates.prepended) > 0 || pending[0]) {
          // this means that at least one item appended in the last batch has height > 0
          // pending[0] = true means that previous fetch was appending. We need to force at least one prepend
          // BTW there will always be at least 1 element in the pending array because bottom is fetched first
          if (pending.push(false) === 1) {
            adapter.loading(true);
            fetch(rid);
          }
        }
      }
    }

    function processUpdates() {
      var updates = updateDOM();

      // We need the item bindings to be processed before we can do adjustments
      !$scope.$$phase && !$rootScope.$$phase && $scope.$digest();

      updates.inserted.forEach(function (w) {
        return elementRoutines.showElement(w);
      });
      updates.prepended.forEach(function (w) {
        return elementRoutines.showElement(w);
      });
      return updates;
    }

    function doAdjust(rid) {
      if (!rid) {
        // dismiss pending requests
        pending = [];
        rid = ++ridActual;
      }

      var updates = processUpdates();

      if (isInvalid(rid)) {
        return;
      }

      updatePaddings(rid, updates);
      enqueueFetch(rid);

      if (!pending.length) {
        adapter.calculateProperties();
      }
    }

    function doAdjustAfterFetch(rid) {
      var updates = processUpdates();

      viewport.onAfterPrepend(updates);

      if (isInvalid(rid)) {
        return;
      }

      updatePaddings(rid, updates);
      onRenderHandlersRunner();
      enqueueFetch(rid, updates);
      pending.shift();

      if (pending.length) fetch(rid);else {
        adapter.loading(false);
        bindEvents();
        adapter.calculateProperties();
      }
    }

    function fetch(rid) {
      if (pending[0]) {
        // scrolling down
        if (buffer.length && !viewport.shouldLoadBottom()) {
          doAdjustAfterFetch(rid);
        } else {
          fetchNext(function (result) {
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

            doAdjustAfterFetch(rid);
          });
        }
      } else {
        // scrolling up
        if (buffer.length && !viewport.shouldLoadTop()) {
          doAdjustAfterFetch(rid);
        } else {
          fetchPrevious(function (result) {
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

            doAdjustAfterFetch(rid);
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
          !$scope.$$phase && $scope.$digest();
        }
      }
    }

    function wheelHandler(event) {
      if (!adapter.disabled) {
        var scrollTop = viewport[0].scrollTop;
        var yMax = viewport[0].scrollHeight - viewport[0].clientHeight;

        if (scrollTop === 0 && !buffer.bof || scrollTop === yMax && !buffer.eof) {
          event.preventDefault();
        }
      }
    }
  }
}]);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var JQLiteExtras = function () {
  function JQLiteExtras() {
    _classCallCheck(this, JQLiteExtras);
  }

  _createClass(JQLiteExtras, [{
    key: 'registerFor',
    value: function registerFor(element) {
      var convertToPx = void 0,
          css = void 0,
          getStyle = void 0,
          isWindow = void 0;
      // angular implementation blows up if elem is the window
      css = angular.element.prototype.css;

      element.prototype.css = function (name, value) {
        var self = this;
        var elem = self[0];
        if (!(!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style)) {
          return css.call(self, name, value);
        }
      };

      // as defined in angularjs v1.0.5
      isWindow = function isWindow(obj) {
        return obj && obj.document && obj.location && obj.alert && obj.setInterval;
      };

      function scrollTo(self, direction, value) {
        var elem = self[0];

        var _top$left$direction = _slicedToArray({
          top: ['scrollTop', 'pageYOffset', 'scrollLeft'],
          left: ['scrollLeft', 'pageXOffset', 'scrollTop']
        }[direction], 3),
            method = _top$left$direction[0],
            prop = _top$left$direction[1],
            preserve = _top$left$direction[2];

        var isValueDefined = typeof value !== 'undefined';
        if (isWindow(elem)) {
          if (isValueDefined) {
            return elem.scrollTo(self[preserve].call(self), value);
          }
          return prop in elem ? elem[prop] : elem.document.documentElement[method];
        } else {
          if (isValueDefined) {
            elem[method] = value;
          }
          return elem[method];
        }
      }

      if (window.getComputedStyle) {
        getStyle = function getStyle(elem) {
          return window.getComputedStyle(elem, null);
        };
        convertToPx = function convertToPx(elem, value) {
          return parseFloat(value);
        };
      } else {
        getStyle = function getStyle(elem) {
          return elem.currentStyle;
        };
        convertToPx = function convertToPx(elem, value) {
          var left = void 0,
              result = void 0,
              rs = void 0,
              rsLeft = void 0,
              style = void 0;
          var core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
          var rnumnonpx = new RegExp('^(' + core_pnum + ')(?!px)[a-z%]+$', 'i');

          if (!rnumnonpx.test(value)) {
            return parseFloat(value);
          }

          // ported from JQuery
          style = elem.style;
          left = style.left;
          rs = elem.runtimeStyle;
          rsLeft = rs && rs.left;
          if (rs) {
            rs.left = style.left;
          }
          // put in the new values to get a computed style out
          style.left = value;
          result = style.pixelLeft;
          style.left = left;
          if (rsLeft) {
            rs.left = rsLeft;
          }
          return result;
        };
      }

      function getMeasurements(elem, measure) {
        var base = void 0,
            borderA = void 0,
            borderB = void 0,
            computedMarginA = void 0,
            computedMarginB = void 0,
            computedStyle = void 0,
            dirA = void 0,
            dirB = void 0,
            marginA = void 0,
            marginB = void 0,
            paddingA = void 0,
            paddingB = void 0;

        if (isWindow(elem)) {
          base = document.documentElement[{ height: 'clientHeight', width: 'clientWidth' }[measure]];

          return {
            base: base,
            padding: 0,
            border: 0,
            margin: 0
          };
        }

        // Start with offset property

        var _width$height$measure = _slicedToArray({
          width: [elem.offsetWidth, 'Left', 'Right'],
          height: [elem.offsetHeight, 'Top', 'Bottom']
        }[measure], 3);

        base = _width$height$measure[0];
        dirA = _width$height$measure[1];
        dirB = _width$height$measure[2];


        computedStyle = getStyle(elem);
        paddingA = convertToPx(elem, computedStyle['padding' + dirA]) || 0;
        paddingB = convertToPx(elem, computedStyle['padding' + dirB]) || 0;
        borderA = convertToPx(elem, computedStyle['border' + dirA + 'Width']) || 0;
        borderB = convertToPx(elem, computedStyle['border' + dirB + 'Width']) || 0;
        computedMarginA = computedStyle['margin' + dirA];
        computedMarginB = computedStyle['margin' + dirB];

        // I do not care for width for now, so this hack is irrelevant
        // if ( !supportsPercentMargin )
        // computedMarginA = hackPercentMargin( elem, computedStyle, computedMarginA )
        // computedMarginB = hackPercentMargin( elem, computedStyle, computedMarginB )
        marginA = convertToPx(elem, computedMarginA) || 0;
        marginB = convertToPx(elem, computedMarginB) || 0;

        return {
          base: base,
          padding: paddingA + paddingB,
          border: borderA + borderB,
          margin: marginA + marginB
        };
      }

      function getWidthHeight(elem, direction, measure) {
        var computedStyle = void 0,
            result = void 0;

        var measurements = getMeasurements(elem, direction);

        if (measurements.base > 0) {
          return {
            base: measurements.base - measurements.padding - measurements.border,
            outer: measurements.base,
            outerfull: measurements.base + measurements.margin
          }[measure];
        }

        // Fall back to computed then uncomputed css if necessary
        computedStyle = getStyle(elem);
        result = computedStyle[direction];

        if (result < 0 || result === null) {
          result = elem.style[direction] || 0;
        }

        // Normalize "", auto, and prepare for extra
        result = parseFloat(result) || 0;

        return {
          base: result - measurements.padding - measurements.border,
          outer: result,
          outerfull: result + measurements.padding + measurements.border + measurements.margin
        }[measure];
      }

      // define missing methods
      return angular.forEach({
        before: function before(newElem) {
          var children, elem, i, j, parent, ref, self;
          self = this;
          elem = self[0];
          parent = self.parent();
          children = parent.contents();
          if (children[0] === elem) {
            return parent.prepend(newElem);
          } else {
            for (i = j = 1, ref = children.length - 1; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
              if (children[i] === elem) {
                angular.element(children[i - 1]).after(newElem);
                return;
              }
            }
            throw new Error('invalid DOM structure ' + elem.outerHTML);
          }
        },
        height: function height(value) {
          var self;
          self = this;
          if (typeof value !== 'undefined') {
            if (Number.isInteger(value)) {
              value = value + 'px';
            }
            return css.call(self, 'height', value);
          } else {
            return getWidthHeight(this[0], 'height', 'base');
          }
        },
        outerHeight: function outerHeight(option) {
          return getWidthHeight(this[0], 'height', option ? 'outerfull' : 'outer');
        },
        outerWidth: function outerWidth(option) {
          return getWidthHeight(this[0], 'width', option ? 'outerfull' : 'outer');
        },


        /*
         The offset setter method is not implemented
         */
        offset: function offset(value) {
          var docElem = void 0,
              win = void 0;
          var self = this;
          var box = {
            top: 0,
            left: 0
          };
          var elem = self[0];
          var doc = elem && elem.ownerDocument;

          if (arguments.length) {
            if (value === undefined) {
              return self;
            }
            // TODO: implement setter
            throw new Error('offset setter method is not implemented');
          }

          if (!doc) {
            return;
          }

          docElem = doc.documentElement;

          // TODO: Make sure it's not a disconnected DOM node

          if (elem.getBoundingClientRect != null) {
            box = elem.getBoundingClientRect();
          }

          win = doc.defaultView || doc.parentWindow;

          return {
            top: box.top + (win.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
            left: box.left + (win.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
          };
        },
        scrollTop: function scrollTop(value) {
          return scrollTo(this, 'top', value);
        },
        scrollLeft: function scrollLeft(value) {
          return scrollTo(this, 'left', value);
        }
      }, function (value, key) {
        if (!element.prototype[key]) {
          return element.prototype[key] = value;
        }
      });
    }
  }]);

  return JQLiteExtras;
}();

exports.default = JQLiteExtras;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var hideClassToken = 'ng-ui-scroll-hide';

var ElementRoutines = function () {
  _createClass(ElementRoutines, null, [{
    key: 'addCSSRules',
    value: function addCSSRules() {
      var selector = '.' + hideClassToken;
      var rules = 'display: none';
      var sheet = document.styleSheets[0];
      var index = void 0;
      try {
        index = sheet.cssRules.length;
      } catch (err) {
        index = 0;
      }
      if ('insertRule' in sheet) {
        sheet.insertRule(selector + '{' + rules + '}', index);
      } else if ('addRule' in sheet) {
        sheet.addRule(selector, rules, index);
      }
    }
  }]);

  function ElementRoutines($injector, $q) {
    _classCallCheck(this, ElementRoutines);

    this.$animate = $injector.has && $injector.has('$animate') ? $injector.get('$animate') : null;
    this.isAngularVersionLessThen1_3 = angular.version.major === 1 && angular.version.minor < 3;
    this.$q = $q;
  }

  _createClass(ElementRoutines, [{
    key: 'hideElement',
    value: function hideElement(wrapper) {
      wrapper.element.addClass(hideClassToken);
    }
  }, {
    key: 'showElement',
    value: function showElement(wrapper) {
      wrapper.element.removeClass(hideClassToken);
    }
  }, {
    key: 'insertElement',
    value: function insertElement(newElement, previousElement) {
      previousElement.after(newElement);
      return [];
    }
  }, {
    key: 'removeElement',
    value: function removeElement(wrapper) {
      wrapper.element.remove();
      wrapper.scope.$destroy();
      return [];
    }
  }, {
    key: 'insertElementAnimated',
    value: function insertElementAnimated(newElement, previousElement) {
      if (!this.$animate) {
        return this.insertElement(newElement, previousElement);
      }

      if (this.isAngularVersionLessThen1_3) {
        var deferred = this.$q.defer();
        // no need for parent - previous element is never null
        this.$animate.enter(newElement, null, previousElement, function () {
          return deferred.resolve();
        });

        return [deferred.promise];
      }

      // no need for parent - previous element is never null
      return [this.$animate.enter(newElement, null, previousElement)];
    }
  }, {
    key: 'removeElementAnimated',
    value: function removeElementAnimated(wrapper) {
      if (!this.$animate) {
        return this.removeElement(wrapper);
      }

      if (this.isAngularVersionLessThen1_3) {
        var deferred = this.$q.defer();
        this.$animate.leave(wrapper.element, function () {
          wrapper.scope.$destroy();
          return deferred.resolve();
        });

        return [deferred.promise];
      }

      return [this.$animate.leave(wrapper.element).then(function () {
        return wrapper.scope.$destroy();
      })];
    }
  }]);

  return ElementRoutines;
}();

exports.default = ElementRoutines;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ScrollBuffer;
function ScrollBuffer(elementRoutines, bufferSize, startIndex) {
  var buffer = Object.create(Array.prototype);

  Object.assign(buffer, {
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
      buffer.maxIndex = buffer.eof ? buffer.next - 1 : Math.max(buffer.next - 1, buffer.maxIndex);
    },
    prepend: function prepend(items) {
      items.reverse().forEach(function (item) {
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
    insert: function insert(operation, item, isTop) {
      var wrapper = {
        item: item
      };

      if (operation % 1 === 0) {
        // it is an insert
        wrapper.op = 'insert';
        buffer.splice(operation, 0, wrapper);
        if (isTop) {
          buffer.first--;
        } else {
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
    remove: function remove(arg1, arg2) {
      if (Number.isInteger(arg1)) {
        // removes items from arg1 (including) through arg2 (excluding)
        for (var i = arg1; i < arg2; i++) {
          elementRoutines.removeElement(buffer[i]);
        }
        return buffer.splice(arg1, arg2 - arg1);
      }
      // removes single item(wrapper) from the buffer
      buffer.splice(buffer.indexOf(arg1), 1);
      if (arg1._op === 'isTop' && buffer.first === this.getAbsMinIndex()) {
        this.incrementMinIndex();
      } else {
        this.decrementMaxIndex();
      }
      if (arg1._op === 'isTop') {
        buffer.first++;
      } else {
        buffer.next--;
      }
      if (!buffer.length) {
        buffer.first = 1;
        buffer.next = 1;
      }

      return elementRoutines.removeElementAnimated(arg1);
    },
    incrementMinIndex: function incrementMinIndex() {
      if (buffer.minIndexUser !== null) {
        if (buffer.minIndex > buffer.minIndexUser) {
          buffer.minIndexUser++;
          return;
        }
        if (buffer.minIndex === buffer.minIndexUser) {
          buffer.minIndexUser++;
        }
      }
      buffer.minIndex++;
    },
    decrementMaxIndex: function decrementMaxIndex() {
      if (buffer.maxIndexUser !== null && buffer.maxIndex <= buffer.maxIndexUser) {
        buffer.maxIndexUser--;
      }
      buffer.maxIndex--;
    },
    getAbsMinIndex: function getAbsMinIndex() {
      if (buffer.minIndexUser !== null) {
        return Math.min(buffer.minIndexUser, buffer.minIndex);
      }
      return buffer.minIndex;
    },
    getAbsMaxIndex: function getAbsMaxIndex() {
      if (buffer.maxIndexUser !== null) {
        return Math.max(buffer.maxIndexUser, buffer.maxIndex);
      }
      return buffer.maxIndex;
    },
    effectiveHeight: function effectiveHeight(elements) {
      if (!elements.length) {
        return 0;
      }
      var top = Number.MAX_VALUE;
      var bottom = Number.NEGATIVE_INFINITY;
      elements.forEach(function (wrapper) {
        if (wrapper.element[0].offsetParent) {
          // element style is not display:none
          top = Math.min(top, wrapper.element.offset().top);
          bottom = Math.max(bottom, wrapper.element.offset().top + wrapper.element.outerHeight(true));
        }
      });
      return Math.max(0, bottom - top);
    }
  });

  buffer.reset(startIndex);

  return buffer;
}

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Viewport;

var _padding = __webpack_require__(5);

var _padding2 = _interopRequireDefault(_padding);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Viewport(elementRoutines, buffer, element, viewportController, $rootScope, padding) {
  var topPadding = null;
  var bottomPadding = null;
  var viewport = viewportController && viewportController.viewport ? viewportController.viewport : angular.element(window);
  var container = viewportController && viewportController.container ? viewportController.container : undefined;
  var scope = viewportController && viewportController.scope ? viewportController.scope : $rootScope;

  viewport.css({
    'overflow-anchor': 'none',
    'overflow-y': 'auto',
    'display': 'block'
  });

  function bufferPadding() {
    return viewport.outerHeight() * padding; // some extra space to initiate preload
  }

  Object.assign(viewport, {
    getScope: function getScope() {
      return scope;
    },
    createPaddingElements: function createPaddingElements(template) {
      topPadding = new _padding2.default(template);
      bottomPadding = new _padding2.default(template);
      element.before(topPadding.element);
      element.after(bottomPadding.element);
      topPadding.height(0);
      bottomPadding.height(0);
    },
    applyContainerStyle: function applyContainerStyle() {
      if (!container) {
        return true;
      }
      if (container !== viewport) {
        viewport.css('height', window.getComputedStyle(container[0]).height);
      }
      return viewport.height() > 0;
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
      return elementRoutines.insertElement(e, sibling || topPadding.element);
    },
    insertElementAnimated: function insertElementAnimated(e, sibling) {
      return elementRoutines.insertElementAnimated(e, sibling || topPadding.element);
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
        viewport.adjustPaddings();
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
    adjustPaddings: function adjustPaddings() {
      if (!buffer.length) {
        return;
      }

      // precise heights calculation based on items that are in buffer or that were in buffer once
      var visibleItemsHeight = buffer.reduce(function (summ, item) {
        return summ + item.element.outerHeight(true);
      }, 0);

      var topPaddingHeight = 0,
          topCount = 0;
      topPadding.cache.forEach(function (item) {
        if (item.index < buffer.first) {
          topPaddingHeight += item.height;
          topCount++;
        }
      });

      var bottomPaddingHeight = 0,
          bottomCount = 0;
      bottomPadding.cache.forEach(function (item) {
        if (item.index >= buffer.next) {
          bottomPaddingHeight += item.height;
          bottomCount++;
        }
      });

      var totalHeight = visibleItemsHeight + topPaddingHeight + bottomPaddingHeight;
      var averageItemHeight = totalHeight / (topCount + bottomCount + buffer.length);

      // average heights calculation, items that have never been reached
      var adjustTopPadding = buffer.minIndexUser !== null && buffer.minIndex > buffer.minIndexUser;
      var adjustBottomPadding = buffer.maxIndexUser !== null && buffer.maxIndex < buffer.maxIndexUser;
      var topPaddingHeightAdd = adjustTopPadding ? (buffer.minIndex - buffer.minIndexUser) * averageItemHeight : 0;
      var bottomPaddingHeightAdd = adjustBottomPadding ? (buffer.maxIndexUser - buffer.maxIndex) * averageItemHeight : 0;

      // paddings combine adjustment
      topPadding.height(topPaddingHeight + topPaddingHeightAdd);
      bottomPadding.height(bottomPaddingHeight + bottomPaddingHeightAdd);
    },
    onAfterMinIndexSet: function onAfterMinIndexSet(topPaddingHeightOld) {
      // additional scrollTop adjustment in case of datasource.minIndex external set
      if (buffer.minIndexUser !== null && buffer.minIndex > buffer.minIndexUser) {
        var diff = topPadding.height() - topPaddingHeightOld;
        viewport.scrollTop(viewport.scrollTop() + diff);
        while ((diff -= viewport.scrollTop()) > 0) {
          bottomPadding.height(bottomPadding.height() + diff);
          viewport.scrollTop(viewport.scrollTop() + diff);
        }
      }
    },
    onAfterPrepend: function onAfterPrepend(updates) {
      if (!updates.prepended.length) return;
      var height = buffer.effectiveHeight(updates.prepended);
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
    },
    removeCacheItem: function removeCacheItem(item, isTop) {
      topPadding.cache.remove(item, isTop);
      bottomPadding.cache.remove(item, isTop);
    },
    removeItem: function removeItem(item) {
      this.removeCacheItem(item);
      return buffer.remove(item);
    }
  });

  return viewport;
}

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Can't just extend the Array, due to Babel does not support built-in classes extending
// This solution was taken from https://stackoverflow.com/questions/46897414/es6-class-extends-array-workaround-for-es5-babel-transpile
var CacheProto = function () {
  function CacheProto() {
    _classCallCheck(this, CacheProto);
  }

  _createClass(CacheProto, [{
    key: 'add',
    value: function add(item) {
      for (var i = this.length - 1; i >= 0; i--) {
        if (this[i].index === item.scope.$index) {
          this[i].height = item.element.outerHeight();
          return;
        }
      }
      this.push({
        index: item.scope.$index,
        height: item.element.outerHeight()
      });
      this.sort(function (a, b) {
        return a.index < b.index ? -1 : a.index > b.index ? 1 : 0;
      });
    }
  }, {
    key: 'remove',
    value: function remove(argument, _isTop) {
      var index = argument % 1 === 0 ? argument : argument.scope.$index;
      var isTop = argument % 1 === 0 ? _isTop : argument._op === 'isTop';
      for (var i = this.length - 1; i >= 0; i--) {
        if (this[i].index === index) {
          this.splice(i, 1);
          break;
        }
      }
      if (!isTop) {
        for (var _i = this.length - 1; _i >= 0; _i--) {
          if (this[_i].index > index) {
            this[_i].index--;
          }
        }
      }
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.length = 0;
    }
  }]);

  return CacheProto;
}();

function Cache() {
  var instance = [];
  instance.push.apply(instance, arguments);
  Object.setPrototypeOf(instance, Cache.prototype);
  return instance;
}
Cache.prototype = Object.create(Array.prototype);
Object.getOwnPropertyNames(CacheProto.prototype).forEach(function (methodName) {
  return Cache.prototype[methodName] = CacheProto.prototype[methodName];
});

function generateElement(template) {
  if (template.nodeType !== Node.ELEMENT_NODE) {
    throw new Error('ui-scroll directive requires an Element node for templating the view');
  }
  var element = void 0;
  switch (template.tagName.toLowerCase()) {
    case 'dl':
      throw new Error('ui-scroll directive does not support <' + template.tagName + '> as a repeating tag: ' + template.outerHTML);
    case 'tr':
      var table = angular.element('<table><tr><td><div></div></td></tr></table>');
      element = table.find('tr');
      break;
    case 'li':
      element = angular.element('<li></li>');
      break;
    default:
      element = angular.element('<div></div>');
  }
  return element;
}

var Padding = function () {
  function Padding(template) {
    _classCallCheck(this, Padding);

    this.element = generateElement(template);
    this.cache = new Cache();
  }

  _createClass(Padding, [{
    key: 'height',
    value: function height() {
      return this.element.height.apply(this.element, arguments);
    }
  }]);

  return Padding;
}();

exports.default = Padding;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Adapter = function () {
  function Adapter($scope, $parse, $attr, viewport, buffer, doAdjust, reload) {
    _classCallCheck(this, Adapter);

    this.$parse = $parse;
    this.$attr = $attr;
    this.viewport = viewport;
    this.buffer = buffer;

    this.doAdjust = doAdjust;
    this.reload = reload;

    this.isLoading = false;
    this.disabled = false;

    var viewportScope = viewport.getScope();
    this.startScope = viewportScope.$parent ? viewportScope : $scope;

    this.publicContext = {};
    this.assignAdapter($attr.adapter);
    this.generatePublicContext();
  }

  _createClass(Adapter, [{
    key: 'assignAdapter',
    value: function assignAdapter(adapterAttr) {
      if (!adapterAttr || !(adapterAttr = adapterAttr.replace(/^\s+|\s+$/gm, ''))) {
        return;
      }
      var adapterOnScope = void 0;

      try {
        this.$parse(adapterAttr).assign(this.startScope, {});
        adapterOnScope = this.$parse(adapterAttr)(this.startScope);
      } catch (error) {
        error.message = 'Angular ui-scroll Adapter assignment exception.\n' + ('Can\'t parse "' + adapterAttr + '" expression.\n') + error.message;
        throw error;
      }

      Object.assign(adapterOnScope, this.publicContext);
      this.publicContext = adapterOnScope;
    }
  }, {
    key: 'generatePublicContext',
    value: function generatePublicContext() {
      var _this = this;

      // these methods will be accessible out of ui-scroll via user defined adapter
      var publicMethods = ['reload', 'applyUpdates', 'append', 'prepend', 'isBOF', 'isEOF', 'isEmpty'];
      for (var i = publicMethods.length - 1; i >= 0; i--) {
        this.publicContext[publicMethods[i]] = this[publicMethods[i]].bind(this);
      }

      // these read-only props will be accessible out of ui-scroll via user defined adapter
      var publicProps = ['isLoading', 'topVisible', 'topVisibleElement', 'topVisibleScope', 'bottomVisible', 'bottomVisibleElement', 'bottomVisibleScope'];

      var _loop = function _loop(_i) {
        var property = void 0,
            attr = _this.$attr[publicProps[_i]];
        Object.defineProperty(_this, publicProps[_i], {
          get: function get() {
            return property;
          },
          set: function set(value) {
            property = value;
            _this.publicContext[publicProps[_i]] = value;
            if (attr) {
              _this.$parse(attr).assign(_this.startScope, value);
            }
          }
        });
      };

      for (var _i = publicProps.length - 1; _i >= 0; _i--) {
        _loop(_i);
      }

      // non-read-only public property
      Object.defineProperty(this.publicContext, 'disabled', {
        get: function get() {
          return _this.disabled;
        },
        set: function set(value) {
          return !(_this.disabled = value) ? _this.doAdjust() : null;
        }
      });
    }
  }, {
    key: 'loading',
    value: function loading(value) {
      this.isLoading = value;
    }
  }, {
    key: 'isBOF',
    value: function isBOF() {
      return this.buffer.bof;
    }
  }, {
    key: 'isEOF',
    value: function isEOF() {
      return this.buffer.eof;
    }
  }, {
    key: 'isEmpty',
    value: function isEmpty() {
      return !this.buffer.length;
    }
  }, {
    key: 'append',
    value: function append(newItems) {
      this.buffer.append(newItems);
      this.doAdjust();
      this.viewport.clipTop();
      this.viewport.clipBottom();
    }
  }, {
    key: 'prepend',
    value: function prepend(newItems) {
      this.buffer.prepend(newItems);
      this.doAdjust();
      this.viewport.clipTop();
      this.viewport.clipBottom();
    }
  }, {
    key: 'applyUpdates',
    value: function applyUpdates(arg1, arg2) {
      if (typeof arg1 === 'function') {
        this.applyUpdatesFunc(arg1);
      } else {
        this.applyUpdatesIndex(arg1, arg2);
      }
      this.doAdjust();
    }
  }, {
    key: 'applyUpdatesFunc',
    value: function applyUpdatesFunc(cb) {
      var _this2 = this;

      this.buffer.slice(0).forEach(function (wrapper) {
        // we need to do it on the buffer clone, because buffer content
        // may change as we iterate through
        _this2.applyUpdate(wrapper, cb(wrapper.item, wrapper.scope, wrapper.element));
      });
    }
  }, {
    key: 'applyUpdatesIndex',
    value: function applyUpdatesIndex(index, newItems) {
      if (index % 1 !== 0) {
        throw new Error('applyUpdates - ' + index + ' is not a valid index (should be an integer)');
      }
      var _index = index - this.buffer.first;

      // apply updates only within buffer
      if (_index >= 0 && _index < this.buffer.length) {
        this.applyUpdate(this.buffer[_index], newItems);
      }
      // out-of-buffer case: deletion may affect Paddings
      else if (index >= this.buffer.getAbsMinIndex() && index <= this.buffer.getAbsMaxIndex()) {
          if (Array.isArray(newItems) && !newItems.length) {
            this.viewport.removeCacheItem(index, index === this.buffer.minIndex);
            if (index === this.buffer.getAbsMinIndex()) {
              this.buffer.incrementMinIndex();
            } else {
              this.buffer.decrementMaxIndex();
            }
          }
        }
    }
  }, {
    key: 'applyUpdate',
    value: function applyUpdate(wrapper, newItems) {
      var _this3 = this;

      if (!Array.isArray(newItems)) {
        return;
      }
      var position = this.buffer.indexOf(wrapper);
      if (!newItems.reverse().some(function (newItem) {
        return newItem === wrapper.item;
      })) {
        wrapper.op = 'remove';
        if (position === 0 && !newItems.length) {
          wrapper._op = 'isTop'; // to catch "first" edge case on remove
        }
      }
      newItems.forEach(function (newItem) {
        if (newItem === wrapper.item) {
          position--;
        } else {
          // 3 parameter (isTop) is to catch "first" edge case on insert
          _this3.buffer.insert(position + 1, newItem, position === -1);
        }
      });
    }
  }, {
    key: 'calculateProperties',
    value: function calculateProperties() {
      var rowTop = null,
          topHeight = 0;
      var topDone = false,
          bottomDone = false;
      var length = this.buffer.length;

      for (var i = 0; i < length; i++) {
        var item = this.buffer[i];
        var itemTop = item.element.offset().top;

        if (rowTop !== itemTop) {
          // a new row condition
          var itemHeight = item.element.outerHeight(true);
          var top = this.viewport.topDataPos() + topHeight + itemHeight;

          if (!topDone && top > this.viewport.topVisiblePos()) {
            topDone = true;
            this['topVisible'] = item.item;
            this['topVisibleElement'] = item.element;
            this['topVisibleScope'] = item.scope;
          }
          if (!bottomDone && (top >= this.viewport.bottomVisiblePos() || i === length - 1 && this.isEOF())) {
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
  }]);

  return Adapter;
}();

exports.default = Adapter;

/***/ })
/******/ ]);
//# sourceMappingURL=ui-scroll.js.map