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

import ElementRoutines from './modules/elementRoutines.js';
import Buffer from './modules/buffer.js';
import Viewport from './modules/viewport.js';
import Adapter from './modules/adapter.js';

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
				var startIndex = +attr.startIndex || 1;

				return function link($scope, element, $attr, controllers, linker) {
					// starting from angular 1.2 compileLinker usage is deprecated
					linker = linker || compileLinker;

					const datasource = (() => {
						let isDatasourceValid = function () {
							return angular.isObject(_datasource) && angular.isFunction(_datasource.get);
						};

						let _datasource = $parse(datasourceName)($scope); // try to get datasource on scope
						if (!isDatasourceValid()) {
							_datasource = $injector.get(datasourceName); // try to inject datasource as service
							if (!isDatasourceValid()) {
								throw new Error(datasourceName + ' is not a valid datasource');
							}
						}

						let minIndexDesc = Object.getOwnPropertyDescriptor(_datasource, 'minIndex');
						if (!minIndexDesc || (!minIndexDesc.set && !minIndexDesc.get)) {
							Object.defineProperty(_datasource, 'minIndex', {
								set: function (value) {
									this._minIndex = value;
									onDatasourceMinIndexChanged(value);
								},
								get: function get() {
									return this._minIndex;
								}
							});
						}

						let maxIndexDesc = Object.getOwnPropertyDescriptor(_datasource, 'maxIndex');
						if (!maxIndexDesc || (!maxIndexDesc.set && !maxIndexDesc.get)) {
							Object.defineProperty(_datasource, 'maxIndex', {
								set: function (value) {
									this._maxIndex = value;
									onDatasourceMaxIndexChanged(value);
								},
								get: function get() {
									return this._maxIndex;
								}
							});
						}

						return _datasource;
					})();

					let ridActual = 0;// current data revision id
					let pending = [];
					let elementRoutines = new ElementRoutines($injector);
					let buffer = new Buffer(elementRoutines, itemName, $scope, linker, bufferSize);
					let viewport = new Viewport(elementRoutines, buffer, element, controllers, $attr);
					let adapter = new Adapter($parse, $attr, viewport, buffer, () => {
						dismissPendingRequests();
						adjustBuffer(ridActual);
					});

					var onDatasourceMinIndexChanged = function (value) {
						$timeout(function () {
							buffer.minIndexUser = value;
							if (!pending.length) {
								viewport.adjustPadding(true);
							}
						});
					};
					var onDatasourceMaxIndexChanged = function (value) {
						$timeout(function () {
							buffer.maxIndexUser = value;
							if (!pending.length) {
								viewport.adjustPadding();
							}
						});
					};

					const fetchNext = (() => {
						if (datasource.get.length !== 2) {
							return (success) => datasource.get(buffer.next, bufferSize, success);
						}

						return (success) => {
							datasource.get({
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
							datasource.get({
								index: buffer.first - bufferSize,
								prepend: buffer.length ? buffer[0].item : void 0,
								count: bufferSize
							}, success);
						};
					})();

					if ($attr.adapter) {
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

					$scope.$on('$destroy', () => {
						// buffer.clear(); *** there is no need to reset the buffer
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

						if (arguments.length)
							startIndex = arguments[0];

						buffer.reset(startIndex);
						adjustBuffer(ridActual);
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
							adjustBuffer();
						}
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

							viewport.adjustScrollTopAfterPrepend(adjustedPaddingHeight);
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
						$timeout(() => {

							processBufferedItems(rid);
							enqueueFetch(rid, true);

							if (!pending.length) {
								adapter.calculateProperties();
							}
						});
					}

					function adjustBufferAfterFetch(rid) {
						// We need the item bindings to be processed before we can do adjustment
						$timeout(() => {

							enqueueFetch(rid, processBufferedItems(rid));
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
									if ((rid && rid !== ridActual) || $scope.$$destroyed) {
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
						} else {  // scrolling up
							if (buffer.length && !viewport.shouldLoadTop()) {
								adjustBufferAfterFetch(rid);
							} else {
								fetchPrevious((result) => {
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