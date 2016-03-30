import { ElementRoutines } from './misc/elementRoutines.js';
import { Cache } from './misc/cache.js';
import { Buffer } from './misc/buffer.js';
import { Viewport } from './misc/viewport.js';
import { Adapter } from './misc/adapter.js';

export var uiScroll = [
	'$log',
	'$injector',
	'$rootScope',
	'$timeout',
	'$q',
	'$parse',
	function (console, $injector, $rootScope, $timeout, $q, $parse) {
		//const log = console.debug || console.log;

		return {
			require: ['?^uiScrollViewport'],
			transclude: 'element',
			priority: 1000,
			terminal: true,
			compile
		};

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
				let cache = new Cache();
				let elementRoutines = new ElementRoutines($injector);
				let buffer = new Buffer(elementRoutines, itemName, $scope, linker, bufferSize);
				let viewport = new Viewport(elementRoutines, buffer, cache, element, controllers, $attr);
				let adapter = new Adapter($parse, $attr, viewport, buffer, () => {
					dismissPendingRequests();
					adjustBuffer(ridActual);
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
					cache.clear();

					adjustBuffer(ridActual);
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

					adjustBuffer();
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
							adjustBuffer(rid);
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
							adapter.calculateProperties();
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
];
