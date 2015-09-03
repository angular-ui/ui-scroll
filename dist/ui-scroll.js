/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.3.2 -- 2015-09-03T15:39:10.862Z
 * License: MIT
 */
 

 (function () {
'use strict';

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
angular.module('ui.scroll', []).directive('uiScrollViewport', function() {
  return {
    controller: [
      '$scope', '$element', function(scope, element) {
        this.viewport = element;
        return this;
      }
    ]
  };
}).directive('uiScroll', [
  '$log', '$injector', '$rootScope', '$timeout', '$q', '$parse', function(console, $injector, $rootScope, $timeout, $q, $parse) {
    var $animate;
    if ($injector.has && $injector.has('$animate')) {
      $animate = $injector.get('$animate');
    }
    return {
      require: ['?^uiScrollViewport'],
      transclude: 'element',
      priority: 1000,
      terminal: true,
      compile: function(elementTemplate, attr, linker) {
        return function($scope, element, $attr, controllers) {
          var adapter, adapterOnScope, adjustBuffer, adjustBufferAfterFetch, applyUpdate, bof, bottomVisiblePos, buffer, bufferPadding, bufferSize, builder, calculateTopProperties, clipBottom, clipTop, datasource, datasourceName, dismissPendingRequests, enqueueFetch, eof, eventListener, fetch, first, insertElement, insertElementAnimated, insertItem, insertWrapperContent, isAngularVersionLessThen1_3, isDatasourceValid, isElementVisible, itemName, loading, log, match, next, pending, processBufferedItems, reload, removeFromBuffer, removeItem, resizeAndScrollHandler, ridActual, scrollHeight, shouldLoadBottom, shouldLoadTop, topVisible, topVisiblePos, unsupportedMethod, viewport, viewportScope, visibilityWatcher, wheelHandler;
          log = console.debug || console.log;
          if (!(match = $attr.uiScroll.match(/^\s*(\w+)\s+in\s+([\w\.]+)\s*$/))) {
            throw new Error('Expected uiScroll in form of \'_item_ in _datasource_\' but got \' + $attr.uiScroll + \'');
          }
          itemName = match[1];
          datasourceName = match[2];
          datasource = $parse(datasourceName)($scope);
          isDatasourceValid = function() {
            return angular.isObject(datasource) && angular.isFunction(datasource.get);
          };
          if (!isDatasourceValid()) {
            datasource = $injector.get(datasourceName);
            if (!isDatasourceValid()) {
              throw new Error(datasourceName + ' is not a valid datasource');
            }
          }
          bufferSize = Math.max(3, +$attr.bufferSize || 10);
          bufferPadding = function() {
            return viewport.outerHeight() * Math.max(0.1, +$attr.padding || 0.1);
          };
          scrollHeight = function(elem) {
            var ref;
            return (ref = elem[0].scrollHeight) != null ? ref : elem[0].document.documentElement.scrollHeight;
          };
          builder = null;
          ridActual = 0;
          first = 1;
          next = 1;
          buffer = [];
          pending = [];
          eof = false;
          bof = false;
          isAngularVersionLessThen1_3 = angular.version.major === 1 && angular.version.minor < 3;
          removeItem = $animate ? isAngularVersionLessThen1_3 ? function(wrapper) {
            var deferred;
            buffer.splice(buffer.indexOf(wrapper), 1);
            deferred = $q.defer();
            $animate.leave(wrapper.element, function() {
              wrapper.scope.$destroy();
              return deferred.resolve();
            });
            return [deferred.promise];
          } : function(wrapper) {
            buffer.splice(buffer.indexOf(wrapper), 1);
            return [
              ($animate.leave(wrapper.element)).then(function() {
                return wrapper.scope.$destroy();
              })
            ];
          } : function(wrapper) {
            buffer.splice(buffer.indexOf(wrapper), 1);
            wrapper.element.remove();
            wrapper.scope.$destroy();
            return [];
          };
          insertElement = function(newElement, previousElement) {
            element.after.apply(previousElement, [newElement]);
            return [];
          };
          insertElementAnimated = $animate ? isAngularVersionLessThen1_3 ? function(newElement, previousElement) {
            var deferred;
            deferred = $q.defer();
            $animate.enter(newElement, element, previousElement, function() {
              return deferred.resolve();
            });
            return [deferred.promise];
          } : function(newElement, previousElement) {
            return [$animate.enter(newElement, element, previousElement)];
          } : insertElement;
          linker($scope.$new(), function(template, scope) {
            var bottomPadding, padding, repeaterType, topPadding, viewport;
            scope.$destroy();
            repeaterType = template[0].localName;
            if (repeaterType === 'dl') {
              throw new Error('ui-scroll directive does not support <' + template[0].localName + '> as a repeating tag: ' + template[0].outerHTML);
            }
            if (repeaterType !== 'li' && repeaterType !== 'tr') {
              repeaterType = 'div';
            }
            viewport = controllers[0] && controllers[0].viewport ? controllers[0].viewport : angular.element(window);
            viewport.css({
              'overflow-y': 'auto',
              'display': 'block'
            });
            padding = function(repeaterType) {
              var div, result, table;
              switch (repeaterType) {
                case 'tr':
                  table = angular.element('<table><tr><td><div></div></td></tr></table>');
                  div = table.find('div');
                  result = table.find('tr');
                  result.paddingHeight = function() {
                    return div.height.apply(div, arguments);
                  };
                  break;
                default:
                  result = angular.element('<' + repeaterType + '></' + repeaterType + '>');
                  result.paddingHeight = result.height;
              }
              return result;
            };
            topPadding = padding(repeaterType);
            element.before(topPadding);
            bottomPadding = padding(repeaterType);
            element.after(bottomPadding);
            $scope.$on('$destroy', function() {
              return template.remove();
            });
            return builder = {
              viewport: viewport,
              topPadding: function() {
                return topPadding.paddingHeight.apply(topPadding, arguments);
              },
              bottomPadding: function() {
                return bottomPadding.paddingHeight.apply(bottomPadding, arguments);
              },
              bottomDataPos: function() {
                return scrollHeight(viewport) - bottomPadding.paddingHeight();
              },
              topDataPos: function() {
                return topPadding.paddingHeight();
              },
              insertElement: function(e, sibling) {
                return insertElement(e, sibling || topPadding);
              },
              insertElementAnimated: function(e, sibling) {
                return insertElementAnimated(e, sibling || topPadding);
              }
            };
          });
          viewport = builder.viewport;
          viewportScope = viewport.scope() || $rootScope;
          topVisible = function(item) {
            adapter.topVisible = item.scope[itemName];
            adapter.topVisibleElement = item.element;
            adapter.topVisibleScope = item.scope;
            if ($attr.topVisible) {
              $parse($attr.topVisible).assign(viewportScope, adapter.topVisible);
            }
            if ($attr.topVisibleElement) {
              $parse($attr.topVisibleElement).assign(viewportScope, adapter.topVisibleElement);
            }
            if ($attr.topVisibleScope) {
              $parse($attr.topVisibleScope).assign(viewportScope, adapter.topVisibleScope);
            }
            if (angular.isFunction(datasource.topVisible)) {
              return datasource.topVisible(item);
            }
          };
          loading = function(value) {
            adapter.isLoading = value;
            if ($attr.isLoading) {
              $parse($attr.isLoading).assign($scope, value);
            }
            if (angular.isFunction(datasource.loading)) {
              return datasource.loading(value);
            }
          };
          removeFromBuffer = function(start, stop) {
            var i, j, ref, ref1;
            for (i = j = ref = start, ref1 = stop; ref <= ref1 ? j < ref1 : j > ref1; i = ref <= ref1 ? ++j : --j) {
              buffer[i].scope.$destroy();
              buffer[i].element.remove();
            }
            return buffer.splice(start, stop - start);
          };
          dismissPendingRequests = function() {
            ridActual++;
            return pending = [];
          };
          reload = function() {
            dismissPendingRequests();
            first = 1;
            next = 1;
            removeFromBuffer(0, buffer.length);
            builder.topPadding(0);
            builder.bottomPadding(0);
            eof = false;
            bof = false;
            return adjustBuffer(ridActual);
          };
          bottomVisiblePos = function() {
            return viewport.scrollTop() + viewport.outerHeight();
          };
          topVisiblePos = function() {
            return viewport.scrollTop();
          };
          shouldLoadBottom = function() {
            return !eof && builder.bottomDataPos() < bottomVisiblePos() + bufferPadding();
          };
          clipBottom = function() {
            var bottomHeight, i, item, itemHeight, itemTop, j, newRow, overage, ref, rowTop;
            bottomHeight = 0;
            overage = 0;
            for (i = j = ref = buffer.length - 1; ref <= 0 ? j <= 0 : j >= 0; i = ref <= 0 ? ++j : --j) {
              item = buffer[i];
              itemTop = item.element.offset().top;
              newRow = rowTop !== itemTop;
              rowTop = itemTop;
              if (newRow) {
                itemHeight = item.element.outerHeight(true);
              }
              if (builder.bottomDataPos() - bottomHeight - itemHeight > bottomVisiblePos() + bufferPadding()) {
                if (newRow) {
                  bottomHeight += itemHeight;
                }
                overage++;
                eof = false;
              } else {
                if (newRow) {
                  break;
                }
                overage++;
              }
            }
            if (overage > 0) {
              builder.bottomPadding(builder.bottomPadding() + bottomHeight);
              removeFromBuffer(buffer.length - overage, buffer.length);
              return next -= overage;
            }
          };
          shouldLoadTop = function() {
            return !bof && (builder.topDataPos() > topVisiblePos() - bufferPadding());
          };
          clipTop = function() {
            var item, itemHeight, itemTop, j, len, newRow, overage, rowTop, topHeight;
            topHeight = 0;
            overage = 0;
            for (j = 0, len = buffer.length; j < len; j++) {
              item = buffer[j];
              itemTop = item.element.offset().top;
              newRow = rowTop !== itemTop;
              rowTop = itemTop;
              if (newRow) {
                itemHeight = item.element.outerHeight(true);
              }
              if (builder.topDataPos() + topHeight + itemHeight < topVisiblePos() - bufferPadding()) {
                if (newRow) {
                  topHeight += itemHeight;
                }
                overage++;
                bof = false;
              } else {
                if (newRow) {
                  break;
                }
                overage++;
              }
            }
            if (overage > 0) {
              builder.topPadding(builder.topPadding() + topHeight);
              removeFromBuffer(0, overage);
              return first += overage;
            }
          };
          enqueueFetch = function(rid, direction) {
            if (!adapter.isLoading) {
              loading(true);
            }
            if (pending.push(direction) === 1) {
              return fetch(rid);
            }
          };
          insertItem = function(operation, item) {
            var itemScope, wrapper;
            itemScope = $scope.$new();
            itemScope[itemName] = item;
            wrapper = {
              scope: itemScope
            };
            linker(itemScope, function(clone) {
              return wrapper.element = clone;
            });
            if (operation % 1 === 0) {
              wrapper.op = 'insert';
              return buffer.splice(operation, 0, wrapper);
            } else {
              wrapper.op = operation;
              switch (operation) {
                case 'append':
                  return buffer.push(wrapper);
                case 'prepend':
                  return buffer.unshift(wrapper);
              }
            }
          };
          isElementVisible = function(wrapper) {
            return wrapper.element.height() && wrapper.element[0].offsetParent;
          };
          visibilityWatcher = function(wrapper) {
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
          insertWrapperContent = function(wrapper, sibling) {
            builder.insertElement(wrapper.element, sibling);
            if (isElementVisible(wrapper)) {
              return true;
            }
            wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch(function() {
              return visibilityWatcher(wrapper);
            });
            return false;
          };
          processBufferedItems = function(rid) {
            var bottomPos, heightIncrement, i, item, j, k, keepFetching, l, len, len1, len2, len3, m, promises, toBePrepended, toBeRemoved, wrapper;
            promises = [];
            toBePrepended = [];
            toBeRemoved = [];
            bottomPos = builder.bottomDataPos();
            for (i = j = 0, len = buffer.length; j < len; i = ++j) {
              wrapper = buffer[i];
              switch (wrapper.op) {
                case 'prepend':
                  toBePrepended.unshift(wrapper);
                  break;
                case 'append':
                  if (i === 0) {
                    keepFetching = insertWrapperContent(wrapper) || keepFetching;
                  } else {
                    keepFetching = insertWrapperContent(wrapper, buffer[i - 1].element) || keepFetching;
                  }
                  wrapper.op = 'none';
                  break;
                case 'insert':
                  if (i === 0) {
                    promises = promises.concat(builder.insertElementAnimated(wrapper.element));
                  } else {
                    promises = promises.concat(builder.insertElementAnimated(wrapper.element, buffer[i - 1].element));
                  }
                  wrapper.op = 'none';
                  break;
                case 'remove':
                  toBeRemoved.push(wrapper);
              }
            }
            for (k = 0, len1 = toBeRemoved.length; k < len1; k++) {
              wrapper = toBeRemoved[k];
              promises = promises.concat(removeItem(wrapper));
            }
            builder.bottomPadding(Math.max(0, builder.bottomPadding() - (builder.bottomDataPos() - bottomPos)));
            if (toBePrepended.length) {
              bottomPos = builder.bottomDataPos();
              for (l = 0, len2 = toBePrepended.length; l < len2; l++) {
                wrapper = toBePrepended[l];
                keepFetching = insertWrapperContent(wrapper) || keepFetching;
                wrapper.op = 'none';
              }
              heightIncrement = builder.bottomDataPos() - bottomPos;
              if (builder.topPadding() >= heightIncrement) {
                builder.topPadding(builder.topPadding() - heightIncrement);
              } else {
                viewport.scrollTop(viewport.scrollTop() + heightIncrement);
              }
            }
            for (i = m = 0, len3 = buffer.length; m < len3; i = ++m) {
              item = buffer[i];
              item.scope.$index = first + i;
            }
            if (promises.length) {
              $q.all(promises).then(function() {
                return adjustBuffer(rid);
              });
            }
            return keepFetching;
          };
          calculateTopProperties = function() {
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
              if (newRow && (builder.topDataPos() + topHeight + itemHeight < topVisiblePos())) {
                results.push(topHeight += itemHeight);
              } else {
                if (newRow) {
                  topVisible(item);
                }
                break;
              }
            }
            return results;
          };
          adjustBuffer = function(rid) {
            return $timeout(function() {
              processBufferedItems(rid);
              if (shouldLoadBottom()) {
                enqueueFetch(rid, true);
              } else {
                if (shouldLoadTop()) {
                  enqueueFetch(rid, false);
                }
              }
              if (pending.length === 0) {
                return calculateTopProperties();
              }
            });
          };
          adjustBufferAfterFetch = function(rid) {
            return $timeout(function() {
              var keepFetching;
              keepFetching = processBufferedItems(rid);
              if (shouldLoadBottom()) {
                if (keepFetching) {
                  enqueueFetch(rid, true);
                }
              } else {
                if (shouldLoadTop()) {
                  if (keepFetching || pending[0]) {
                    enqueueFetch(rid, false);
                  }
                }
              }
              pending.shift();
              if (pending.length === 0) {
                loading(false);
                return calculateTopProperties();
              } else {
                return fetch(rid);
              }
            });
          };
          fetch = function(rid) {
            if (pending[0]) {
              if (buffer.length && !shouldLoadBottom()) {
                return adjustBufferAfterFetch(rid);
              } else {
                return datasource.get(next, bufferSize, function(result) {
                  var item, j, len;
                  if ((rid && rid !== ridActual) || $scope.$$destroyed) {
                    return;
                  }
                  if (result.length < bufferSize) {
                    eof = true;
                    builder.bottomPadding(0);
                  }
                  if (result.length > 0) {
                    clipTop();
                    for (j = 0, len = result.length; j < len; j++) {
                      item = result[j];
                      ++next;
                      insertItem('append', item);
                    }
                  }
                  return adjustBufferAfterFetch(rid);
                });
              }
            } else {
              if (buffer.length && !shouldLoadTop()) {
                return adjustBufferAfterFetch(rid);
              } else {
                return datasource.get(first - bufferSize, bufferSize, function(result) {
                  var i, j, ref;
                  if ((rid && rid !== ridActual) || $scope.$$destroyed) {
                    return;
                  }
                  if (result.length < bufferSize) {
                    bof = true;
                    builder.topPadding(0);
                  }
                  if (result.length > 0) {
                    if (buffer.length) {
                      clipBottom();
                    }
                    for (i = j = ref = result.length - 1; ref <= 0 ? j <= 0 : j >= 0; i = ref <= 0 ? ++j : --j) {
                      --first;
                      insertItem('prepend', result[i]);
                    }
                  }
                  return adjustBufferAfterFetch(rid);
                });
              }
            }
          };
          resizeAndScrollHandler = function() {
            if (!$rootScope.$$phase && !adapter.isLoading) {
              adjustBuffer();
              return $scope.$apply();
            }
          };
          wheelHandler = function(event) {
            var scrollTop, yMax;
            scrollTop = viewport[0].scrollTop;
            yMax = viewport[0].scrollHeight - viewport[0].clientHeight;
            if ((scrollTop === 0 && !bof) || (scrollTop === yMax && !eof)) {
              return event.preventDefault();
            }
          };
          viewport.bind('resize', resizeAndScrollHandler);
          viewport.bind('scroll', resizeAndScrollHandler);
          viewport.bind('mousewheel', wheelHandler);
          $scope.$watch(datasource.revision, reload);
          $scope.$on('$destroy', function() {
            var item, j, len;
            for (j = 0, len = buffer.length; j < len; j++) {
              item = buffer[j];
              item.scope.$destroy();
              item.element.remove();
            }
            viewport.unbind('resize', resizeAndScrollHandler);
            viewport.unbind('scroll', resizeAndScrollHandler);
            return viewport.unbind('mousewheel', wheelHandler);
          });
          adapter = {};
          adapter.isLoading = false;
          adapter.reload = reload;
          applyUpdate = function(wrapper, newItems) {
            var i, j, keepIt, len, newItem, pos, ref;
            if (angular.isArray(newItems)) {
              pos = (buffer.indexOf(wrapper)) + 1;
              ref = newItems.reverse();
              for (i = j = 0, len = ref.length; j < len; i = ++j) {
                newItem = ref[i];
                if (newItem === wrapper.scope[itemName]) {
                  keepIt = true;
                  pos--;
                } else {
                  insertItem(pos, newItem);
                }
              }
              if (!keepIt) {
                return wrapper.op = 'remove';
              }
            }
          };
          adapter.applyUpdates = function(arg1, arg2) {
            var bufferClone, i, j, len, ref, wrapper;
            dismissPendingRequests();
            if (angular.isFunction(arg1)) {
              bufferClone = buffer.slice(0);
              for (i = j = 0, len = bufferClone.length; j < len; i = ++j) {
                wrapper = bufferClone[i];
                applyUpdate(wrapper, arg1(wrapper.scope[itemName], wrapper.scope, wrapper.element));
              }
            } else {
              if (arg1 % 1 === 0) {
                if ((0 <= (ref = arg1 - first) && ref < buffer.length)) {
                  applyUpdate(buffer[arg1 - first], arg2);
                }
              } else {
                throw new Error('applyUpdates - ' + arg1 + ' is not a valid index');
              }
            }
            return adjustBuffer(ridActual);
          };
          adapter.append = function(newItems) {
            var item, j, len;
            dismissPendingRequests();
            for (j = 0, len = newItems.length; j < len; j++) {
              item = newItems[j];
              ++next;
              insertItem('append', item);
            }
            return adjustBuffer(ridActual);
          };
          adapter.prepend = function(newItems) {
            var item, j, len, ref;
            dismissPendingRequests();
            ref = newItems.reverse();
            for (j = 0, len = ref.length; j < len; j++) {
              item = ref[j];
              --first;
              insertItem('prepend', item);
            }
            return adjustBuffer(ridActual);
          };
          if ($attr.adapter) {
            adapterOnScope = $parse($attr.adapter)($scope);
            if (!adapterOnScope) {
              $parse($attr.adapter).assign($scope, {});
              adapterOnScope = $parse($attr.adapter)($scope);
            }
            angular.extend(adapterOnScope, adapter);
            adapter = adapterOnScope;
          }
          unsupportedMethod = function(token) {
            throw new Error(token + ' event is no longer supported - use applyUpdates instead');
          };
          eventListener = datasource.scope ? datasource.scope.$new() : $scope.$new();
          eventListener.$on('insert.item', function() {
            return unsupportedMethod('insert');
          });
          eventListener.$on('update.items', function() {
            return unsupportedMethod('update');
          });
          return eventListener.$on('delete.items', function() {
            return unsupportedMethod('delete');
          });
        };
      }
    };
  }
]);


/*
//# sourceURL=src/ui-scroll.js
 */
}());