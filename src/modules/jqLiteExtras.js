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

export default class JQLiteExtras {

  registerFor(element) {
    let convertToPx, css, getStyle, isWindow;
    // angular implementation blows up if elem is the window
    css = angular.element.prototype.css;

    element.prototype.css = function (name, value) {
      let self = this;
      let elem = self[0];
      if (!(!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style)) {
        return css.call(self, name, value);
      }
    };

    // as defined in angularjs v1.0.5
    isWindow = (obj) => obj && obj.document && obj.location && obj.alert && obj.setInterval;

    function scrollTo(self, direction, value) {
      let elem = self[0];
      let [method, prop, preserve] = {
        top: [
          'scrollTop',
          'pageYOffset',
          'scrollLeft'
        ],
        left: [
          'scrollLeft',
          'pageXOffset',
          'scrollTop'
        ]
      }[direction];

      if (isWindow(elem)) {
        if (angular.isDefined(value)) {
          return elem.scrollTo(self[preserve].call(self), value);
        }
        return (prop in elem) ? elem[prop] : elem.document.documentElement[method];
      } else {
        if (angular.isDefined(value)) {
          elem[method] = value;
        }
        return elem[method];
      }
    }

    if (window.getComputedStyle) {
      getStyle = (elem) => window.getComputedStyle(elem, null);
      convertToPx = (elem, value) => parseFloat(value);
    } else {
      getStyle = (elem) => elem.currentStyle;
      convertToPx = (elem, value) => {
        let left, result, rs, rsLeft, style;
        let core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
        let rnumnonpx = new RegExp('^(' + core_pnum + ')(?!px)[a-z%]+$', 'i');

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
      let base, borderA, borderB, computedMarginA, computedMarginB, computedStyle, dirA, dirB, marginA, marginB, paddingA, paddingB;

      if (isWindow(elem)) {
        base = document.documentElement[{height: 'clientHeight', width: 'clientWidth'}[measure]];

        return {
          base: base,
          padding: 0,
          border: 0,
          margin: 0
        };
      }

      // Start with offset property
      [
        base,
        dirA,
        dirB
      ] = {
        width: [
          elem.offsetWidth,
          'Left',
          'Right'
        ],
        height: [
          elem.offsetHeight,
          'Top',
          'Bottom'
        ]
      }[measure];

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
      let computedStyle, result;

      let measurements = getMeasurements(elem, direction);

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
      before(newElem) {
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
      height (value){
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
      outerHeight(option) {
        return getWidthHeight(this[0], 'height', option ? 'outerfull' : 'outer');
      },
      outerWidth(option) {
        return getWidthHeight(this[0], 'width', option ? 'outerfull' : 'outer');
      },

      /*
       The offset setter method is not implemented
       */
      offset(value) {
        let docElem, win;
        let self = this;
        let box = {
          top: 0,
          left: 0
        };
        let elem = self[0];
        let doc = elem && elem.ownerDocument;

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
      scrollTop(value) {
        return scrollTo(this, 'top', value);
      },
      scrollLeft(value) {
        return scrollTo(this, 'left', value);
      }
    }, (value, key) => {
      if (!element.prototype[key]) {
        return element.prototype[key] = value;
      }
    });
  }

}
