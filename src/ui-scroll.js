import JQLiteExtras from './modules/jqLiteExtras';
import ElementRoutines from './modules/elementRoutines.js';
import ScrollBuffer from './modules/buffer.js';
import Viewport from './modules/viewport.js';
import Adapter from './modules/adapter.js';

angular.module('ui.scroll', [])

  .service('jqLiteExtras', () => new JQLiteExtras())
  .run(['jqLiteExtras', (jqLiteExtras) =>
    !window.jQuery ? jqLiteExtras.registerFor(angular.element) : null
  ])

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

          angular.forEach(element.children(), (child => {
            if (child.tagName.toLowerCase() === 'tbody') {
              this.viewport = angular.element(child);
            }
          }));

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

        function parseNumericAttr(value, defaultValue) {
          let result = $parse(value)($scope);
          return isNaN(result) ? defaultValue : result;
        }

        const BUFFER_MIN = 3;
        const BUFFER_DEFAULT = 10;
        const PADDING_MIN = 0.3;
        const PADDING_DEFAULT = 0.5;

        let datasource = null;
        const itemName = match[1];
        const datasourceName = match[2];
        const viewportController = controllers[0];
        const bufferSize = Math.max(BUFFER_MIN, parseNumericAttr($attr.bufferSize, BUFFER_DEFAULT));
        const padding = Math.max(PADDING_MIN, parseNumericAttr($attr.padding, PADDING_DEFAULT));
        let startIndex = parseNumericAttr($attr.startIndex, 1);
        let ridActual = 0;// current data revision id
        let pending = [];

        let elementRoutines = new ElementRoutines($injector, $q);
        let buffer = new ScrollBuffer(elementRoutines, bufferSize);
        let viewport = new Viewport(elementRoutines, buffer, element, viewportController, $rootScope, padding);
        let adapter = new Adapter(viewport, buffer, adjustBuffer, reload, $attr, $parse, element, $scope);

        if (viewportController) {
          viewportController.adapter = adapter;
        }

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
          if (!descriptor || (!descriptor.set && !descriptor.get)) {
            Object.defineProperty(datasource, propName, {
              set: (value) => {
                indexStore[propName] = value;
                $timeout(() => {
                  buffer[propUserName] = value;
                  if (!pending.length) {
                    let topPaddingHeightOld = viewport.topDataPos();
                    viewport.adjustPadding();
                    if (propName === 'minIndex') {
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
            buffer.forEach((item) => {
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
            wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch(() => visibilityWatcher(wrapper));
          }
          wrapper.element.addClass('ng-hide'); // hide inserted elements before data binding
        }

        function createElement(wrapper, insertAfter, insertElement) {
          let promises = null;
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
            if (!updates || buffer.effectiveHeight(updates.inserted) > 0) {
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
          if (!rid) { // dismiss pending requests
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
          if (!adapter.disabled) {
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