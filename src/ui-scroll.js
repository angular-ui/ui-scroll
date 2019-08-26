import JQLiteExtras from './modules/jqLiteExtras';
import ElementRoutines from './modules/elementRoutines.js';
import ScrollBuffer from './modules/buffer.js';
import Viewport from './modules/viewport.js';
import Adapter from './modules/adapter.js';

angular.module('ui.scroll', [])

  .constant('JQLiteExtras', JQLiteExtras)
  .run(['JQLiteExtras', (JQLiteExtras) => {
    const elt = angular.element;
    !(window.jQuery && elt.fn && elt.fn.jquery) ? (new JQLiteExtras()).registerFor(elt) : null;
    ElementRoutines.addCSSRules();
  }])

  .directive('uiScrollViewport', function () {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        '$element',
        function (scope, element) {
          this.container = element;
          this.viewport = element;
          this.scope = scope;

          angular.forEach(element.children(), child => {
            if (child.tagName.toLowerCase() === 'tbody') {
              this.viewport = angular.element(child);
            }
          });

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
    '$interval',
    '$q',
    '$parse',
    function (console, $injector, $rootScope, $timeout, $interval, $q, $parse) {

      return {
        require: ['?^uiScrollViewport'],
        restrict: 'A',
        transclude: 'element',
        priority: 1000,
        terminal: true,
        link: link
      };

      function link($scope, element, $attr, controllers, linker) {
        const match = $attr.uiScroll.match(/^\s*(\w+)\s+in\s+([(\w|\$)\.]+)\s*$/);
        if (!match) {
          throw new Error('Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + $attr.uiScroll + '\'');
        }

        function parseNumber(value, defaultValue, isFloat) {
          if (!isFloat) {
            value = value === null ? defaultValue : Math.floor(value);
          }
          return isNaN(value) ? defaultValue : value;
        }

        function parseNumericAttr(value, defaultValue, isFloat) {
          const result = $parse(value)($scope);
          return parseNumber(result, defaultValue, isFloat);
        }

        const BUFFER_MIN = 3; // Minimum size of the data source request
        const BUFFER_DEFAULT = 10; // Default datasource request size
        const PADDING_MIN = 0.3; // Mininum # of rows in the padding area
        const PADDING_DEFAULT = 0.5; // Default # of rows in the padding area
        const START_INDEX_DEFAULT = 1; // Default start index when requestng the first data block
        const MAX_VIEWPORT_DELAY = 500; // Max time wait (ms) to get the viewport with an height>0
        const VIEWPORT_POLLING_INTERVAL = 50; // Interval used to check the initial viewport height

        let datasource = null;
        const itemName = match[1]; // Name of the index variable to publish
        const datasourceName = match[2]; // Name of the datasource to request the rows from
        const viewportController = controllers[0]; // ViewportController, as specified in the require option (http://websystique.com/angularjs/angularjs-custom-directives-controllers-require-option-guide/)
        const bufferSize = Math.max(BUFFER_MIN, parseNumericAttr($attr.bufferSize, BUFFER_DEFAULT)); 
        const padding = Math.max(PADDING_MIN, parseNumericAttr($attr.padding, PADDING_DEFAULT, true));
        let startIndex = parseNumericAttr($attr.startIndex, START_INDEX_DEFAULT);

        // PHIL: Provide a fixed row height
        // 
        const rowHeight = parseNumericAttr($attr.rowHeight, null, false);

        // PHIL: Read the visibility watch option, true by default
        const allowVisibilityWatch = $attr.allowVisibilityWatch!=='false';

        // Revision IDs
        // 
        let ridActual = 0; // current data revision id
        let pending = [];

        const elementRoutines = new ElementRoutines($injector, $q);
        const buffer = new ScrollBuffer(elementRoutines, bufferSize, startIndex, rowHeight);
        const viewport = new Viewport(elementRoutines, buffer, element, viewportController, $rootScope, padding, rowHeight);
        const adapter = new Adapter($scope, $parse, $attr, viewport, buffer, doAdjust, reload);

        if (viewportController) {
          viewportController.adapter = adapter;
        }

        // Currently, we only debounce the scroll events when a fixed rowHeight is provided
        // as the unit tests will have to be adapted to support this feature
        let scPreviousScrollTop=-1;

        const isDatasourceValid = () =>
          Object.prototype.toString.call(datasource) === '[object Object]' && typeof datasource.get === 'function';

        datasource = $parse(datasourceName)($scope); // try to get datasource on scope
        if (!isDatasourceValid()) {
          datasource = $injector.get(datasourceName); // try to inject datasource as service
          if (!isDatasourceValid()) {
            throw new Error(datasourceName + ' is not a valid datasource');
          }
        }

        let onRenderHandlers = [];
        function onRenderHandlersRunner() {
          onRenderHandlers.forEach(handler => handler.run());
          onRenderHandlers = [];
        }
        function persistDatasourceIndex(datasource, propName) {
          let getter;
          // need to postpone min/maxIndexUser processing if the view is empty
          if(angular.isNumber(datasource[propName])) {
            getter = datasource[propName];
            if(angular.isNumber(getter)) {
              onRenderHandlers = onRenderHandlers.filter(handler => handler.id !== propName);
              onRenderHandlers.push({
                id: propName,
                run: () => datasource[propName] = getter
              });
            }
          }
        }

        function defineDatasourceIndex(datasource, propName, propUserName) {
          const descriptor = Object.getOwnPropertyDescriptor(datasource, propName);
          if (descriptor && (descriptor.set || descriptor.get)) {
            return;
          }
          let getter;
          persistDatasourceIndex(datasource, propName);
          Object.defineProperty(datasource, propName, {
            set: (value) => {
              getter = value;
              if(pending.length && !buffer.length) {
                persistDatasourceIndex(datasource, propName);
                return;
              }
              buffer[propUserName] = value;
              const topPaddingHeightOld = viewport.topDataPos();
              viewport.adjustPaddings();
              if (propName === 'minIndex') {
                viewport.onAfterMinIndexSet(topPaddingHeightOld);
              }
            },
            get: () => getter
          });
        }

        defineDatasourceIndex(datasource, 'minIndex', 'minIndexUser');
        defineDatasourceIndex(datasource, 'maxIndex', 'maxIndexUser');

        const fetchNext = (datasource.get.length !== 2) ?
          (success) => datasource.get(buffer.next, bufferSize, success) :
          (success) => {
            datasource.get({
              index: buffer.next,
              append: buffer.length ? buffer[buffer.length - 1].item : void 0,
              count: bufferSize
            }, success);
          };

        const fetchPrevious = (datasource.get.length !== 2) ?
          (success) => datasource.get(buffer.first - bufferSize, bufferSize, success) :
          (success) => {
            datasource.get({
              index: buffer.first - bufferSize,
              prepend: buffer.length ? buffer[0].item : void 0,
              count: bufferSize
            }, success);
          };

        const initialize = () => {
          let tryCount = 0;
          if(!viewport.applyContainerStyle()) {
            const timer = $interval(() => {
              tryCount++;
              if(viewport.applyContainerStyle()) {
                $interval.cancel(timer);
                doAdjust();
              }
              if(tryCount * VIEWPORT_POLLING_INTERVAL >= MAX_VIEWPORT_DELAY) {
                $interval.cancel(timer);
                throw Error(`ui-scroll directive requires a viewport with non-zero height in ${MAX_VIEWPORT_DELAY}ms`);
              }
            }, VIEWPORT_POLLING_INTERVAL);
          }
          else {
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

        initialize();

        /* Private function definitions */

        function isInvalid(rid) {
          return (rid && rid !== ridActual) || $scope.$$destroyed;
        }

        function bindEvents() {
          viewport.bind('resize', resizeAndScrollHandler);
          viewport.bind('scroll', resizeAndScrollHandler);
          // If a scroll event happened while the handler was not bounded, emit the scroll
          if(isPendingScroll()) {
            // Do it immediately
            _resizeAndScrollHandler();
          }
        }

        function unbindEvents() {
          viewport.unbind('resize', resizeAndScrollHandler);
          viewport.unbind('scroll', resizeAndScrollHandler);
        }

        function reload() {
          unbindEvents();
          viewport.resetTopPadding();
          viewport.resetBottomPadding();
          if (arguments.length) {
            startIndex = parseNumber(arguments[0], START_INDEX_DEFAULT, false);
          }
          buffer.reset(startIndex);
          scPreviousScrollTop = -1; // Avoid isScrollPending() to be true
          persistDatasourceIndex(datasource, 'minIndex');
          persistDatasourceIndex(datasource, 'maxIndex');
          doAdjust();
        }

        function scrollTo(first) {
          unbindEvents();
          viewport.scrollTo(first);
          doAdjust();
        }

        function isElementVisible(wrapper) {
          return (rowHeight || wrapper.element.height()) && wrapper.element[0].offsetParent;
        }

        function visibilityWatcher(wrapper) {
          if (isElementVisible(wrapper)) {
            buffer.forEach((item) => {
              if (typeof item.unregisterVisibilityWatcher === 'function') {
                item.unregisterVisibilityWatcher();
                delete item.unregisterVisibilityWatcher;
              }
            });
            if (!pending.length) {
              $timeout(() => doAdjust());
            }
          }
        }

        function insertWrapperContent(wrapper, insertAfter) {
          createElement(wrapper, insertAfter, viewport.insertElement);
          if (allowVisibilityWatch && !isElementVisible(wrapper)) {
            wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch(() => visibilityWatcher(wrapper));
          }
          if (allowVisibilityWatch) {
            elementRoutines.hideElement(wrapper); // hide inserted elements before data binding
          }
        }

        function createElement(wrapper, insertAfter, insertElement) {
          let promises = null;
          const sibling = (insertAfter > 0) ? buffer[insertAfter - 1].element : undefined;
          linker((clone, scope) => {
            promises = insertElement(clone, sibling);
            wrapper.element = clone;
            wrapper.scope = scope;
            scope[itemName] = wrapper.item;
          });
          // ui-scroll-grid apply
          if (adapter.transform) {
            const tdInitializer = wrapper.scope.uiScrollTdInitializer;
            if (tdInitializer && tdInitializer.linking) {
              adapter.transform(wrapper.scope, wrapper.element);
            } else {
              wrapper.scope.uiScrollTdInitializer = {
                onLink: () => adapter.transform(wrapper.scope, wrapper.element),
                scope: wrapper.scope
              };
            }
          }
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

          toBeRemoved.forEach((wrapper) => promises = promises.concat(viewport.removeItem(wrapper)));

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

        // Adjust the viewport paddings
        // 
        function updatePaddings(rid, updates) {
          // schedule another doAdjust after animation completion
          if (updates.animated.length) {
            $q.all(updates.animated).then(() => {
              viewport.adjustPaddings();
              doAdjust(rid);
            });
          } else {
            viewport.adjustPaddings();
          }
        }

        function enqueueFetch(rid, updates) {
          // If there is a scroll pending, we don't enqueue the fetch as the scroll might be an absolute scroll
          // So we don't need to load top or bottom
          // This happens when there is a scroll frenzi, and the $digest is slow enough, so it stacks the calls without
          // giving a chance to the scroll event to be emitted and processed.
          // We also do that if it leads to an absolute scroll
          if(isPendingScroll() && calculateAbsoluteScroll()!==undefined) {
            // Looks like the event is swallowed on some browsers (FF) on some scroll configuration
            resizeAndScrollHandler();
            return;
          }

          if (viewport.shouldLoadBottom()) {
            if (!updates || buffer.effectiveHeight(updates.inserted) > 0) {
              // this means that at least one item appended in the last batch has height > 0
              if (pending.push(true) === 1) {
                adapter.loading(true);
                fetch(rid);
              }
            }
          } else if (viewport.shouldLoadTop()) {
            if ((!updates || buffer.effectiveHeight(updates.prepended) > 0) || pending[0]) {
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
          const updates = updateDOM();

          // We need the item bindings to be processed before we can do adjustments
          // If there  are no changes and the row-height is static, then ignore it!
          const changes = updates.animated.length+updates.inserted.length+updates.prepended.length+updates.removed.length;
          if(changes || !rowHeight) {
            !$scope.$$phase && !$rootScope.$$phase && $scope.$digest();
          }

          if (allowVisibilityWatch) {
            updates.inserted.forEach(w => elementRoutines.showElement(w));
            updates.prepended.forEach(w => elementRoutines.showElement(w));
          }

          return updates;
        }

        function doAdjust(rid) {
          if (!rid) { // dismiss pending requests
            pending = [];
            rid = ++ridActual;
          }

          const updates = processUpdates();

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
          const updates = processUpdates();

          viewport.onAfterPrepend(updates);

          if (isInvalid(rid)) {
            return;
          }

          updatePaddings(rid, updates);
          onRenderHandlersRunner();
          enqueueFetch(rid, updates);
          pending.shift();

          if (pending.length)
            fetch(rid);
          else {
            adapter.loading(false);
            bindEvents();
            adapter.calculateProperties();
          }
        }

        function fetch(rid) {
          if (pending[0]) {// scrolling down
            if (buffer.length && !viewport.shouldLoadBottom()) {
              doAdjustAfterFetch(rid);
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

                doAdjustAfterFetch(rid);
              });
            }
          } else {  // scrolling up
            if (buffer.length && !viewport.shouldLoadTop()) {
              doAdjustAfterFetch(rid);
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

                doAdjustAfterFetch(rid);
              });
            }
          }
        }

        function isPendingScroll() {
          if(rowHeight) {
            // Maybe the scroll changed but the event has *not* yet being dispatched
            // because of the $digest running and taking to long
            var sc = viewport.scrollTop();
            if(sc!=scPreviousScrollTop && scPreviousScrollTop>=0) {
              return true;
            }
          }
          return false;
        }

        // Deboucing the scroll events avois intermediate $digest when scrolling fast
        let scTimer;
        function resizeAndScrollHandler() {
          if (rowHeight) {
            if (scTimer) clearTimeout(scTimer);
            scTimer = setTimeout(_resizeAndScrollHandler, 50);
          } else {
            _resizeAndScrollHandler();
          }
        }

        function _resizeAndScrollHandler() {
          if (!$rootScope.$$phase && !adapter.isLoading && !adapter.disabled) {
            // Absolute positioning currently only works when a fixed rowHeight is provided
            // We might isolate the averegaRowHeight calculation in the viewport to provide an estimate
            // and provide a reasonable behavior with variable height as well
            if(rowHeight) {
              const newFirst = calculateAbsoluteScroll();
              if(newFirst!==undefined) {
                scrollTo(newFirst);
                return;
              }
            }

            enqueueFetch(ridActual);

            if (pending.length) {
              unbindEvents();
            } else {
              adapter.calculateProperties();
              if(!rowHeight) {
                // The digest is forced to calculate the height, which is not necessary when the height is knowm
                !$scope.$$phase && $scope.$digest();
              }
            }
          }
        }

        function calculateAbsoluteScroll() {
            if(rowHeight) {
              scPreviousScrollTop = viewport.scrollTop();
              let newFirst = Math.floor(viewport.scrollTop() / rowHeight) + buffer.getAbsMinIndex();
              newFirst = Math.max(buffer.getAbsMinIndex(), Math.min(buffer.getAbsMaxIndex(),newFirst)); // Bound the scroll
              if (newFirst<buffer.first-bufferSize) {
                return newFirst;
              }         
              if (newFirst>buffer.next+bufferSize) {
                return newFirst;
              }         
            }
            return undefined;
        }

        function wheelHandler(event) {
          if (!adapter.disabled) {
            const scrollTop = viewport[0].scrollTop;
            const yMax = viewport[0].scrollHeight - viewport[0].clientHeight;

            if ((scrollTop === 0 && !buffer.bof) || (scrollTop === yMax && !buffer.eof)) {
              event.preventDefault();
            }
          }
        }
      }

    }
  ]);
