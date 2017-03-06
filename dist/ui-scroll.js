/*!
 * angular-ui-scroll (uncompressed)
 * https://github.com/angular-ui/ui-scroll
 * Version: 1.6.1 -- 2017-03-06T07:25:29.944Z
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
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
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
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
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
	
	angular.module('ui.scroll', []).service('jqLiteExtras', function () {
	  return new _jqLiteExtras2.default();
	}).run(['jqLiteExtras', function (jqLiteExtras) {
	  return !window.jQuery ? jqLiteExtras.registerFor(angular.element) : null;
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
	}).directive('uiScroll', ['$log', '$injector', '$rootScope', '$timeout', '$q', '$parse', function (console, $injector, $rootScope, $timeout, $q, $parse) {
	
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
	    var buffer = new _buffer2.default(elementRoutines, bufferSize);
	    var viewport = new _viewport2.default(elementRoutines, buffer, element, viewportController, $rootScope, padding);
	    var adapter = new _adapter2.default(viewport, buffer, adjustBuffer, reload, $attr, $parse, element, $scope);
	
	    if (viewportController) {
	      viewportController.adapter = adapter;
	    }
	
	    var isDatasourceValid = function isDatasourceValid() {
	      return angular.isObject(datasource) && angular.isFunction(datasource.get);
	    };
	    datasource = $parse(datasourceName)($scope); // try to get datasource on scope
	    if (!isDatasourceValid()) {
	      datasource = $injector.get(datasourceName); // try to inject datasource as service
	      if (!isDatasourceValid()) {
	        throw new Error(datasourceName + ' is not a valid datasource');
	      }
	    }
	
	    var indexStore = {};
	
	    function defineProperty(datasource, propName, propUserName) {
	      var descriptor = Object.getOwnPropertyDescriptor(datasource, propName);
	      if (!descriptor || !descriptor.set && !descriptor.get) {
	        Object.defineProperty(datasource, propName, {
	          set: function set(value) {
	            indexStore[propName] = value;
	            $timeout(function () {
	              buffer[propUserName] = value;
	              if (!pending.length) {
	                var topPaddingHeightOld = viewport.topDataPos();
	                viewport.adjustPadding();
	                if (propName === 'minIndex') {
	                  viewport.adjustScrollTopAfterMinIndexSet(topPaddingHeightOld);
	                }
	              }
	            });
	          },
	          get: function get() {
	            return indexStore[propName];
	          }
	        });
	      }
	    }
	
	    defineProperty(datasource, 'minIndex', 'minIndexUser');
	    defineProperty(datasource, 'maxIndex', 'maxIndexUser');
	
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
	
	    $timeout(function () {
	      viewport.applyContainerStyle();
	      reload();
	    });
	
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
	      adjustBuffer();
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
	        if (!pending.length) {
	          adjustBuffer();
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
	      wrapper.element.addClass('ng-hide'); // hide inserted elements before data binding
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
	      if (adapter.transform) adapter.transform(wrapper.scope, wrapper.element);
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
	        return promises = promises.concat(buffer.remove(wrapper));
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
	      // schedule another adjustBuffer after animation completion
	      if (updates.animated.length) {
	        $q.all(updates.animated).then(function () {
	          viewport.adjustPadding();
	          adjustBuffer(rid);
	        });
	      } else {
	        viewport.adjustPadding();
	      }
	    }
	
	    function enqueueFetch(rid, updates) {
	      if (viewport.shouldLoadBottom()) {
	        if (!updates || buffer.effectiveHeight(updates.inserted) > 0) {
	          // this means that at least one item appended in the last batch has height > 0
	          if (pending.push(true) === 1) {
	            fetch(rid);
	            adapter.loading(true);
	          }
	        }
	      } else if (viewport.shouldLoadTop()) {
	        if (!updates || buffer.effectiveHeight(updates.prepended) > 0 || pending[0]) {
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
	      if (!rid) {
	        // dismiss pending requests
	        pending = [];
	        rid = ++ridActual;
	      }
	
	      var updates = updateDOM();
	
	      // We need the item bindings to be processed before we can do adjustment
	      $timeout(function () {
	
	        // show elements after data binging has been done
	        updates.inserted.forEach(function (w) {
	          return w.element.removeClass('ng-hide');
	        });
	        updates.prepended.forEach(function (w) {
	          return w.element.removeClass('ng-hide');
	        });
	
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
	      var updates = updateDOM();
	
	      // We need the item bindings to be processed before we can do adjustment
	      $timeout(function () {
	
	        // show elements after data binging has been done
	        updates.inserted.forEach(function (w) {
	          return w.element.removeClass('ng-hide');
	        });
	        updates.prepended.forEach(function (w) {
	          return w.element.removeClass('ng-hide');
	        });
	
	        viewport.adjustScrollTopAfterPrepend(updates);
	
	        if (isInvalid(rid)) {
	          return;
	        }
	
	        updatePaddings(rid, updates);
	        enqueueFetch(rid, updates);
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
	      } else {
	        // scrolling up
	        if (buffer.length && !viewport.shouldLoadTop()) {
	          adjustBufferAfterFetch(rid);
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

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	
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
	
	        if (isWindow(elem)) {
	          if (angular.isDefined(value)) {
	            return elem.scrollTo(self[preserve].call(self), value);
	          }
	          return prop in elem ? elem[prop] : elem.document.documentElement[method];
	        } else {
	          if (angular.isDefined(value)) {
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
	          if (angular.isDefined(value)) {
	            if (angular.isNumber(value)) {
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

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var ElementRoutines = function () {
	  function ElementRoutines($injector, $q) {
	    _classCallCheck(this, ElementRoutines);
	
	    this.$animate = $injector.has && $injector.has('$animate') ? $injector.get('$animate') : null;
	    this.isAngularVersionLessThen1_3 = angular.version.major === 1 && angular.version.minor < 3;
	    this.$q = $q;
	  }
	
	  _createClass(ElementRoutines, [{
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
	      var _this = this;
	
	      if (!this.$animate) {
	        return this.insertElement(newElement, previousElement);
	      }
	
	      if (this.isAngularVersionLessThen1_3) {
	        var _ret = function () {
	          var deferred = _this.$q.defer();
	          // no need for parent - previous element is never null
	          _this.$animate.enter(newElement, null, previousElement, function () {
	            return deferred.resolve();
	          });
	
	          return {
	            v: [deferred.promise]
	          };
	        }();
	
	        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	      }
	
	      // no need for parent - previous element is never null
	      return [this.$animate.enter(newElement, null, previousElement)];
	    }
	  }, {
	    key: 'removeElementAnimated',
	    value: function removeElementAnimated(wrapper) {
	      var _this2 = this;
	
	      if (!this.$animate) {
	        return this.removeElement(wrapper);
	      }
	
	      if (this.isAngularVersionLessThen1_3) {
	        var _ret2 = function () {
	          var deferred = _this2.$q.defer();
	          _this2.$animate.leave(wrapper.element, function () {
	            wrapper.scope.$destroy();
	            return deferred.resolve();
	          });
	
	          return {
	            v: [deferred.promise]
	          };
	        }();
	
	        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
	      }
	
	      return [this.$animate.leave(wrapper.element).then(function () {
	        return wrapper.scope.$destroy();
	      })];
	    }
	  }]);
	
	  return ElementRoutines;
	}();
	
	exports.default = ElementRoutines;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = ScrollBuffer;
	function ScrollBuffer(elementRoutines, bufferSize) {
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
	    insert: function insert(operation, item) {
	      var wrapper = {
	        item: item
	      };
	
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
	          elementRoutines.removeElement(buffer[i]);
	        }
	
	        return buffer.splice(arg1, arg2 - arg1);
	      }
	      // removes single item(wrapper) from the buffer
	      buffer.splice(buffer.indexOf(arg1), 1);
	
	      return elementRoutines.removeElementAnimated(arg1);
	    },
	    effectiveHeight: function effectiveHeight(elements) {
	      if (!elements.length) {
	        return 0;
	      }
	      var top = Number.MAX_VALUE;
	      var bottom = Number.MIN_VALUE;
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
	
	  return buffer;
	}

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
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
	
	  angular.extend(viewport, {
	    getScope: function getScope() {
	      return scope;
	    },
	    createPaddingElements: function createPaddingElements(template) {
	      topPadding = new _padding2.default(template);
	      bottomPadding = new _padding2.default(template);
	      element.before(topPadding);
	      element.after(bottomPadding);
	    },
	    applyContainerStyle: function applyContainerStyle() {
	      if (container && container !== viewport) {
	        viewport.css('height', window.getComputedStyle(container[0]).height);
	      }
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
	      return elementRoutines.insertElement(e, sibling || topPadding);
	    },
	    insertElementAnimated: function insertElementAnimated(e, sibling) {
	      return elementRoutines.insertElementAnimated(e, sibling || topPadding);
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
	    adjustPadding: function adjustPadding() {
	      if (!buffer.length) {
	        return;
	      }
	
	      // precise heights calculation, items that were in buffer once
	      var topPaddingHeight = topPadding.cache.reduce(function (summ, item) {
	        return summ + (item.index < buffer.first ? item.height : 0);
	      }, 0);
	      var bottomPaddingHeight = bottomPadding.cache.reduce(function (summ, item) {
	        return summ + (item.index >= buffer.next ? item.height : 0);
	      }, 0);
	
	      // average item height based on buffer data
	      var visibleItemsHeight = buffer.reduce(function (summ, item) {
	        return summ + item.element.outerHeight(true);
	      }, 0);
	      var averageItemHeight = (visibleItemsHeight + topPaddingHeight + bottomPaddingHeight) / (buffer.maxIndex - buffer.minIndex + 1);
	
	      // average heights calculation, items that have never been reached
	      var adjustTopPadding = buffer.minIndexUser !== null && buffer.minIndex > buffer.minIndexUser;
	      var adjustBottomPadding = buffer.maxIndexUser !== null && buffer.maxIndex < buffer.maxIndexUser;
	      var topPaddingHeightAdd = adjustTopPadding ? (buffer.minIndex - buffer.minIndexUser) * averageItemHeight : 0;
	      var bottomPaddingHeightAdd = adjustBottomPadding ? (buffer.maxIndexUser - buffer.maxIndex) * averageItemHeight : 0;
	
	      // paddings combine adjustment
	      topPadding.height(topPaddingHeight + topPaddingHeightAdd);
	      bottomPadding.height(bottomPaddingHeight + bottomPaddingHeightAdd);
	    },
	    adjustScrollTopAfterMinIndexSet: function adjustScrollTopAfterMinIndexSet(topPaddingHeightOld) {
	      // additional scrollTop adjustment in case of datasource.minIndex external set
	      if (buffer.minIndexUser !== null && buffer.minIndex > buffer.minIndexUser) {
	        var diff = topPadding.height() - topPaddingHeightOld;
	        viewport.scrollTop(viewport.scrollTop() + diff);
	      }
	    },
	    adjustScrollTopAfterPrepend: function adjustScrollTopAfterPrepend(updates) {
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
	    }
	  });
	
	  return viewport;
	}

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = Padding;
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
	  var result = void 0;
	
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

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function getCtrlOnData(attr, element) {
	  var onSyntax = attr.match(/^(.+)(\s+on\s+)(.+)?/);
	  if (onSyntax && onSyntax.length === 4) {
	    window.console.log('Angular ui-scroll adapter assignment warning. "Controller On" syntax has been deprecated since ui-scroll v1.6.1.');
	    var ctrl = onSyntax[3];
	    var tail = onSyntax[1];
	    var candidate = element;
	    while (candidate.length) {
	      var candidateScope = candidate.scope(); // doesn't work when debugInfoEnabled flag = true
	      var candidateName = (candidate.attr('ng-controller') || '').match(/(\w(?:\w|\d)*)(?:\s+as\s+(\w(?:\w|\d)*))?/);
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
	
	var Adapter = function () {
	  function Adapter(viewport, buffer, adjustBuffer, reload, $attr, $parse, element, $scope) {
	    _classCallCheck(this, Adapter);
	
	    this.viewport = viewport;
	    this.buffer = buffer;
	    this.adjustBuffer = adjustBuffer;
	    this.reload = reload;
	
	    this.isLoading = false;
	    this.disabled = false;
	
	    var viewportScope = viewport.getScope();
	    this.startScope = viewportScope.$parent ? viewportScope : $scope;
	
	    this.publicContext = {};
	    this.assignAdapter($attr.adapter, $parse, element);
	    this.generatePublicContext($attr, $parse);
	  }
	
	  _createClass(Adapter, [{
	    key: 'assignAdapter',
	    value: function assignAdapter(adapterAttr, $parse, element) {
	      if (!adapterAttr || !(adapterAttr = adapterAttr.replace(/^\s+|\s+$/gm, ''))) {
	        return;
	      }
	      var ctrlOnData = getCtrlOnData(adapterAttr, element);
	      var adapterOnScope = void 0;
	
	      try {
	        if (ctrlOnData) {
	          // "Controller On", deprecated since v1.6.1
	          $parse(ctrlOnData.source).assign(ctrlOnData.target, {});
	          adapterOnScope = $parse(ctrlOnData.source)(ctrlOnData.target);
	        } else {
	          $parse(adapterAttr).assign(this.startScope, {});
	          adapterOnScope = $parse(adapterAttr)(this.startScope);
	        }
	      } catch (error) {
	        error.message = 'Angular ui-scroll Adapter assignment exception.\n' + ('Can\'t parse "' + adapterAttr + '" expression.\n') + error.message;
	        throw error;
	      }
	
	      angular.extend(adapterOnScope, this.publicContext);
	      this.publicContext = adapterOnScope;
	    }
	  }, {
	    key: 'generatePublicContext',
	    value: function generatePublicContext($attr, $parse) {
	      var _this = this;
	
	      // these methods will be accessible out of ui-scroll via user defined adapter
	      var publicMethods = ['reload', 'applyUpdates', 'append', 'prepend', 'isBOF', 'isEOF', 'isEmpty'];
	      for (var i = publicMethods.length - 1; i >= 0; i--) {
	        this.publicContext[publicMethods[i]] = this[publicMethods[i]].bind(this);
	      }
	
	      // these read-only props will be accessible out of ui-scroll via user defined adapter
	      var publicProps = ['isLoading', 'topVisible', 'topVisibleElement', 'topVisibleScope'];
	
	      var _loop = function _loop(_i) {
	        var property = void 0,
	            attr = $attr[publicProps[_i]];
	        Object.defineProperty(_this, publicProps[_i], {
	          get: function get() {
	            return property;
	          },
	          set: function set(value) {
	            property = value;
	            _this.publicContext[publicProps[_i]] = value;
	            if (attr) {
	              $parse(attr).assign(_this.startScope, value);
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
	          return !(_this.disabled = value) ? _this.adjustBuffer() : null;
	        }
	      });
	    }
	  }, {
	    key: 'loading',
	    value: function loading(value) {
	      this['isLoading'] = value;
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
	    key: 'applyUpdates',
	    value: function applyUpdates(arg1, arg2) {
	      var _this2 = this;
	
	      if (angular.isFunction(arg1)) {
	        // arg1 is the updater function, arg2 is ignored
	        this.buffer.slice(0).forEach(function (wrapper) {
	          // we need to do it on the buffer clone, because buffer content
	          // may change as we iterate through
	          _this2.applyUpdate(wrapper, arg1(wrapper.item, wrapper.scope, wrapper.element));
	        });
	      } else {
	        // arg1 is item index, arg2 is the newItems array
	        if (arg1 % 1 !== 0) {
	          // checking if it is an integer
	          throw new Error('applyUpdates - ' + arg1 + ' is not a valid index');
	        }
	
	        var index = arg1 - this.buffer.first;
	        if (index >= 0 && index < this.buffer.length) {
	          this.applyUpdate(this.buffer[index], arg2);
	        }
	      }
	
	      this.adjustBuffer();
	    }
	  }, {
	    key: 'append',
	    value: function append(newItems) {
	      this.buffer.append(newItems);
	      this.adjustBuffer();
	    }
	  }, {
	    key: 'prepend',
	    value: function prepend(newItems) {
	      this.buffer.prepend(newItems);
	      this.adjustBuffer();
	    }
	  }, {
	    key: 'calculateProperties',
	    value: function calculateProperties() {
	      var item = void 0,
	          itemHeight = void 0,
	          itemTop = void 0,
	          isNewRow = void 0,
	          rowTop = null;
	      var topHeight = 0;
	      for (var i = 0; i < this.buffer.length; i++) {
	        item = this.buffer[i];
	        itemTop = item.element.offset().top;
	        isNewRow = rowTop !== itemTop;
	        rowTop = itemTop;
	        if (isNewRow) {
	          itemHeight = item.element.outerHeight(true);
	        }
	        if (isNewRow && this.viewport.topDataPos() + topHeight + itemHeight <= this.viewport.topVisiblePos()) {
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
	  }, {
	    key: 'applyUpdate',
	    value: function applyUpdate(wrapper, newItems) {
	      var _this3 = this;
	
	      if (!angular.isArray(newItems)) {
	        return;
	      }
	
	      var keepIt = void 0;
	      var pos = this.buffer.indexOf(wrapper) + 1;
	
	      newItems.reverse().forEach(function (newItem) {
	        if (newItem === wrapper.item) {
	          keepIt = true;
	          pos--;
	        } else {
	          _this3.buffer.insert(pos, newItem);
	        }
	      });
	
	      if (!keepIt) {
	        wrapper.op = 'remove';
	      }
	    }
	  }]);
	
	  return Adapter;
	}();
	
	exports.default = Adapter;

/***/ }
/******/ ]);
//# sourceMappingURL=ui-scroll.js.map