/*!
 * angular-ui-scroll
 * https://github.com/angular-ui/ui-scroll.git
 * Version: 1.4.1 -- 2016-04-18T22:35:24.296Z
 * License: MIT
 */
 

 (function () {
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=='function'&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error('Cannot find module \''+o+'\'');throw f.code='MODULE_NOT_FOUND',f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=='function'&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

angular.module('ui.scroll.jqlite', ['ui.scroll']).service('jqLiteExtras', function () {
  return {
    registerFor: function registerFor(element) {
      var convertToPx, css, getStyle, isWindow;
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
      isWindow = function (obj) {
        return obj && obj.document && obj.location && obj.alert && obj.setInterval;
      };

      function scrollTo(self, direction, value) {
        var elem = self[0];
        var _top$left$direction = ({
          top: ['scrollTop', 'pageYOffset', 'scrollLeft'],
          left: ['scrollLeft', 'pageXOffset', 'scrollTop']
        })[direction];
        var method = _top$left$direction[0];
        var prop = _top$left$direction[1];
        var preserve = _top$left$direction[2];

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
        getStyle = function (elem) {
          return window.getComputedStyle(elem, null);
        };
        convertToPx = function (elem, value) {
          return parseFloat(value);
        };
      } else {
        getStyle = function (elem) {
          return elem.currentStyle;
        };
        convertToPx = function (elem, value) {
          var left = undefined,
              result = undefined,
              rs = undefined,
              rsLeft = undefined,
              style = undefined;
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
        var base = undefined,
            borderA = undefined,
            borderB = undefined,
            computedMarginA = undefined,
            computedMarginB = undefined,
            computedStyle = undefined,
            dirA = undefined,
            dirB = undefined,
            marginA = undefined,
            marginB = undefined,
            paddingA = undefined,
            paddingB = undefined;

        if (isWindow(elem)) {
          base = document.documentElement[({ height: 'clientHeight', width: 'clientWidth' })[measure]];

          return {
            base: base,
            padding: 0,
            border: 0,
            margin: 0
          };
        }

        // Start with offset property
        var _width$height$measure = ({
          width: [elem.offsetWidth, 'Left', 'Right'],
          height: [elem.offsetHeight, 'Top', 'Bottom']
        })[measure];
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
        var computedStyle = undefined,
            result = undefined;

        var measurements = getMeasurements(elem, direction);

        if (measurements.base > 0) {
          return ({
            base: measurements.base - measurements.padding - measurements.border,
            outer: measurements.base,
            outerfull: measurements.base + measurements.margin
          })[measure];
        }

        // Fall back to computed then uncomputed css if necessary
        computedStyle = getStyle(elem);
        result = computedStyle[direction];

        if (result < 0 || result === null) {
          result = elem.style[direction] || 0;
        }

        // Normalize '', auto, and prepare for extra
        result = parseFloat(result) || 0;

        return ({
          base: result - measurements.padding - measurements.border,
          outer: result,
          outerfull: result + measurements.padding + measurements.border + measurements.margin
        })[measure];
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

        /*
         The offset setter method is not implemented
         */
        offset: function offset(value) {
          var docElem = undefined,
              win = undefined;
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
  };
}).run(['$log', '$window', 'jqLiteExtras', function (console, window, jqLiteExtras) {
  if (!window.jQuery) {
    return jqLiteExtras.registerFor(angular.element);
  }
}]);

},{}]},{},[1]);
}());