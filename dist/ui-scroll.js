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
          var adapter, adapterOnScope, adjustBuffer, applyUpdate, bof, bottomVisiblePos, buffer, bufferPadding, bufferSize, builder, clipBottom, clipTop, datasource, datasourceName, dismissPendingRequests, enqueueFetch, eof, eventListener, fetch, finalize, first, insertElement, insertElementAnimated, insertItem, isDatasourceValid, itemName, loading, log, match, next, pending, reload, removeFromBuffer, removeItem, resizeAndScrollHandler, ridActual, scrollHeight, shouldLoadBottom, shouldLoadTop, topVisible, topVisiblePos, unsupportedMethod, viewport, viewportScope, wheelHandler;
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
            var _ref;
            return (_ref = elem[0].scrollHeight) != null ? _ref : elem[0].document.documentElement.scrollHeight;
          };
          builder = null;
          ridActual = 0;
          first = 1;
          next = 1;
          buffer = [];
          pending = [];
          eof = false;
          bof = false;
          removeItem = $animate ? angular.version.minor === 2 ? function(wrapper) {
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
            element.after.apply(previousElement, newElement);
            return [];
          };
          insertElementAnimated = $animate ? angular.version.minor === 2 ? function(newElement, previousElement) {
            var deferred;
            deferred = $q.defer();
            $animate.enter(newElement, element, previousElement, function() {
              return deferred.resolve();
            });
            return [deferred.promise];
          } : function(newElement, previousElement) {
            return [$animate.enter(newElement, element, previousElement)];
          } : insertElement;
          linker($scope.$new(), function(template) {
            var bottomPadding, padding, repeaterType, topPadding, viewport;
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
              insertElement: function(e, sibling) {
                return insertElement(e, sibling || topPadding);
              },
              insertElementAnimated: function(e, sibling) {
                return insertElementAnimated(e, sibling || topPadding);
              },
              bottomDataPos: function() {
                return scrollHeight(viewport) - bottomPadding.paddingHeight();
              },
              topDataPos: function() {
                return topPadding.paddingHeight();
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
            var i, _i;
            for (i = _i = start; start <= stop ? _i < stop : _i > stop; i = start <= stop ? ++_i : --_i) {
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
            var bottomHeight, i, item, itemHeight, itemTop, newRow, overage, rowTop, _i, _ref;
            bottomHeight = 0;
            overage = 0;
            for (i = _i = _ref = buffer.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
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
            var item, itemHeight, itemTop, newRow, overage, rowTop, topHeight, _i, _len;
            topHeight = 0;
            overage = 0;
            for (_i = 0, _len = buffer.length; _i < _len; _i++) {
              item = buffer[_i];
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
          adjustBuffer = function(rid, finalize) {
            var i, promises, toBePrepended, toBeRemoved, wrapper, _i, _len;
            promises = [];
            toBePrepended = [];
            toBeRemoved = [];
            for (i = _i = 0, _len = buffer.length; _i < _len; i = ++_i) {
              wrapper = buffer[i];
              switch (wrapper.op) {
                case 'prepend':
                  toBePrepended.unshift(wrapper);
                  break;
                case 'append':
                  if (i === 0) {
                    builder.insertElement(wrapper.element);
                  } else {
                    builder.insertElement(wrapper.element, buffer[i - 1].element);
                  }
                  builder.bottomPadding(Math.max(0, builder.bottomPadding() - wrapper.element.outerHeight(true)));
                  wrapper.op = 'none';
                  break;
                case 'insert':
                  if (i === 0) {
                    promises = promises.concat(builder.insertElementAnimated(wrapper.element));
                  } else {
                    promises = promises.concat(builder.insertElementAnimated(wrapper.element, buffer[i - 1].element));
                  }
                  builder.bottomPadding(Math.max(0, builder.bottomPadding() - wrapper.element.outerHeight(true)));
                  wrapper.op = 'none';
                  break;
                case 'remove':
                  toBeRemoved.push(wrapper);
              }
            }
            return $timeout(function() {
              var item, itemHeight, itemTop, newHeight, newRow, rowTop, topHeight, _j, _k, _l, _len1, _len2, _len3, _len4, _m;
              for (_j = 0, _len1 = toBePrepended.length; _j < _len1; _j++) {
                wrapper = toBePrepended[_j];
                builder.insertElement(wrapper.element);
                newHeight = builder.topPadding() - wrapper.element.outerHeight(true);
                if (newHeight >= 0) {
                  builder.topPadding(newHeight);
                } else {
                  viewport.scrollTop(viewport.scrollTop() + wrapper.element.outerHeight(true));
                }
                wrapper.op = 'none';
              }
              for (_k = 0, _len2 = toBeRemoved.length; _k < _len2; _k++) {
                wrapper = toBeRemoved[_k];
                promises = promises.concat(removeItem(wrapper));
              }
              for (i = _l = 0, _len3 = buffer.length; _l < _len3; i = ++_l) {
                item = buffer[i];
                item.scope.$index = first + i;
              }
              if (shouldLoadBottom()) {
                enqueueFetch(rid, true);
              } else {
                if (shouldLoadTop()) {
                  enqueueFetch(rid, false);
                }
              }
              if (finalize) {
                finalize(rid);
              }
              if (pending.length === 0) {
                topHeight = 0;
                for (_m = 0, _len4 = buffer.length; _m < _len4; _m++) {
                  item = buffer[_m];
                  itemTop = item.element.offset().top;
                  newRow = rowTop !== itemTop;
                  rowTop = itemTop;
                  if (newRow) {
                    itemHeight = item.element.outerHeight(true);
                  }
                  if (newRow && (builder.topDataPos() + topHeight + itemHeight < topVisiblePos())) {
                    topHeight += itemHeight;
                  } else {
                    if (newRow) {
                      topVisible(item);
                    }
                    break;
                  }
                }
              }
              if (promises.length) {
                return $q.all(promises).then(function() {
                  return adjustBuffer(rid);
                });
              }
            });
          };
          finalize = function(rid) {
            return adjustBuffer(rid, function() {
              pending.shift();
              if (pending.length === 0) {
                return loading(false);
              } else {
                return fetch(rid);
              }
            });
          };
          fetch = function(rid) {
            if (pending[0]) {
              if (buffer.length && !shouldLoadBottom()) {
                return finalize(rid);
              } else {
                return datasource.get(next, bufferSize, function(result) {
                  var item, _i, _len;
                  if ((rid && rid !== ridActual) || $scope.$$destroyed) {
                    return;
                  }
                  if (result.length < bufferSize) {
                    eof = true;
                    builder.bottomPadding(0);
                  }
                  if (result.length > 0) {
                    clipTop();
                    for (_i = 0, _len = result.length; _i < _len; _i++) {
                      item = result[_i];
                      ++next;
                      insertItem('append', item);
                    }
                  }
                  return finalize(rid);
                });
              }
            } else {
              if (buffer.length && !shouldLoadTop()) {
                return finalize(rid);
              } else {
                return datasource.get(first - bufferSize, bufferSize, function(result) {
                  var i, _i, _ref;
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
                    for (i = _i = _ref = result.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
                      --first;
                      insertItem('prepend', result[i]);
                    }
                  }
                  return finalize(rid);
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
            var item, _i, _len;
            for (_i = 0, _len = buffer.length; _i < _len; _i++) {
              item = buffer[_i];
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
            var i, keepIt, newItem, pos, _i, _len, _ref;
            if (angular.isArray(newItems)) {
              pos = (buffer.indexOf(wrapper)) + 1;
              _ref = newItems.reverse();
              for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                newItem = _ref[i];
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
            var bufferClone, i, wrapper, _i, _len, _ref;
            dismissPendingRequests();
            if (angular.isFunction(arg1)) {
              bufferClone = buffer.slice(0);
              for (i = _i = 0, _len = bufferClone.length; _i < _len; i = ++_i) {
                wrapper = bufferClone[i];
                applyUpdate(wrapper, arg1(wrapper.scope[itemName], wrapper.scope, wrapper.element));
              }
            } else {
              if (arg1 % 1 === 0) {
                if ((0 <= (_ref = arg1 - first) && _ref < buffer.length)) {
                  applyUpdate(buffer[arg1 - first], arg2);
                }
              } else {
                throw new Error('applyUpdates - ' + arg1 + ' is not a valid index');
              }
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