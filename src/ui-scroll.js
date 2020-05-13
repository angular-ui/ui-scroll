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

        function parseBooleanAttr(value, defaultValue) {
          const result = $parse(value)($scope);
          return typeof result === 'boolean' ? result : defaultValue;
        }

        const BUFFER_MIN = 3;
        const BUFFER_DEFAULT = 10;
        const PADDING_MIN = 0.3;
        const PADDING_DEFAULT = 0.5;
        const HANDLE_INERTIA_DEFAULT = true;
        const START_INDEX_DEFAULT = 1;
        const MAX_VIEWPORT_DELAY = 500;
        const VIEWPORT_POLLING_INTERVAL = 50;

        let datasource = null;
        const itemName = match[1];
        const datasourceName = match[2];
        const viewportController = controllers[0];
        const bufferSize = Math.max(BUFFER_MIN, parseNumericAttr($attr.bufferSize, BUFFER_DEFAULT));
        const padding = Math.max(PADDING_MIN, parseNumericAttr($attr.padding, PADDING_DEFAULT, true));
        const handleInertia = parseBooleanAttr($attr.handleInertia, HANDLE_INERTIA_DEFAULT);
        let startIndex = parseNumericAttr($attr.startIndex, START_INDEX_DEFAULT);
        let ridActual = 0; // current data revision id
        let pending = [];

        const elementRoutines = new ElementRoutines($injector, $q);
        const buffer = new ScrollBuffer(elementRoutines, bufferSize, startIndex);
        const viewport = new Viewport(elementRoutines, buffer, element, viewportController, $rootScope, padding);
        const adapter = new Adapter($scope, $parse, $attr, viewport, buffer, doAdjust, reload);

        if (viewportController) {
          viewportController.adapter = adapter;
        }

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
          viewport.off('mousewheel', wheelHandler);
        });

        viewport.on('mousewheel', wheelHandler);

        initialize();

        /* Private function definitions */

        function isInvalid(rid) {
          return (rid && rid !== ridActual) || $scope.$$destroyed;
        }

        function bindEvents() {
          viewport.on('resize', resizeAndScrollHandler);
          viewport.on('scroll', resizeAndScrollHandler);
        }

        function unbindEvents() {
          viewport.off('resize', resizeAndScrollHandler);
          viewport.off('scroll', resizeAndScrollHandler);
        }

        function reload() {
          unbindEvents();
          viewport.resetTopPadding();
          viewport.resetBottomPadding();
          if (arguments.length) {
            startIndex = parseNumber(arguments[0], START_INDEX_DEFAULT, false);
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
          if (!isElementVisible(wrapper)) {
            wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch(() => visibilityWatcher(wrapper));
          }
          elementRoutines.hideElement(wrapper); // hide inserted elements before data binding
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
          !$scope.$$phase && !$rootScope.$$phase && $scope.$digest();

          updates.inserted.forEach(w => elementRoutines.showElement(w));
          updates.prepended.forEach(w => elementRoutines.showElement(w));
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

        function fixInertia() {
          if (!viewport.synthetic) {
            return;
          }
          const oldPosition = viewport.synthetic.previous;
          const newPosition = viewport.synthetic.next;
          if (viewport.scrollTop() !== newPosition) {
            requestAnimationFrame(() => {
              const position = viewport.scrollTop();
              const diff = oldPosition - position;
              if (diff > 0) { // inertia over synthetic
                viewport.scrollTop(newPosition - diff);
              } else {
                viewport.scrollTop(newPosition);
              }
              viewport.synthetic = null;
            });
            return true;
          }
          viewport.synthetic = null;
        }

        function resizeAndScrollHandler() {
          if (handleInertia && fixInertia()) {
            return;
          }
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
