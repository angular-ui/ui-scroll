;(function(angular, undefined, window, document){


	/**
	 * @license AngularJS-DND v0.1.23
	 * (c) 2014-2015 Alexander Afonin (toafonin@gmail.com, http://github.com/Tuch)
	 * License: MIT
	 */

	'use strict';

	/*

	 =================
	 ANGULAR DND:
	 =================

	 */

	/* ENVIRONMENT VARIABLES */

	var version = '0.1.23',
		$ = angular.element, $window = $(window), $document = $(document), body = 'body', TRANSFORM, TRANSFORMORIGIN, MATCHES_SELECTOR,
		debug = {
			mode: false,
			helpers: {}
		},
		forEach = angular.forEach,
		extend = angular.extend;

	(function () {
		window.console = window.console || {
				log: noop,
				info: noop,
				warn: noop,
				error: noop
			};
	})();

	(function() {
		var agent = navigator.userAgent;

		if ( /webkit\//i.test(agent) ) {
			TRANSFORM = '-webkit-transform';
			TRANSFORMORIGIN = '-webkit-transform-origin';
			MATCHES_SELECTOR = 'webkitMatchesSelector';
		} else if (/gecko\//i.test(agent)) {
			TRANSFORM = '-moz-transform';
			TRANSFORMORIGIN = '-moz-transform-origin';
			MATCHES_SELECTOR = 'mozMatchesSelector';
		} else if (/trident\//i.test(agent)) {
			TRANSFORM = '-ms-transform';
			TRANSFORMORIGIN = 'ms-transform-origin';
			MATCHES_SELECTOR = 'msMatchesSelector';
		} else if (/presto\//i.test(agent)) {
			TRANSFORM = '-o-transform';
			TRANSFORMORIGIN = '-o-transform-origin';
			MATCHES_SELECTOR = 'oMatchesSelector';
		} else {
			TRANSFORM = 'transform';
			TRANSFORMORIGIN = 'transform-origin';
			MATCHES_SELECTOR = 'matches';
		}

	})();



	/* SOME HELPERS */

	function noop() {}

	function doFalse() {
		return false;
	}

	function doTrue() {
		return true;
	}

	function proxy(context, fn) {
		return function() {
			fn.apply(context, arguments);
		};
	}

	function degToRad(d) {
		return (d * (Math.PI / 180));
	}

	function radToDeg(r) {
		return (r * (180 / Math.PI));
	}

	function getNumFromSegment(min, curr, max) {
		return curr<min ? min : curr > max ? max : curr;
	}

	function findEvents(element) {

		var events = element.data('events');
		if (events !== undefined) {
			return events;
		}

		events = $.data(element, 'events');
		if (events !== undefined) {
			return events;
		}

		events = $._data(element, 'events');
		if (events !== undefined) {
			return events;
		}

		events = $._data(element[0], 'events');
		if (events !== undefined) {
			return events;
		}

		return undefined;
	}

	function debounce(fn, timeout, invokeAsap, context) {
		if (arguments.length === 3 && typeof invokeAsap !== 'boolean') {
			context = invokeAsap;
			invokeAsap = false;
		}

		var timer;

		return function() {
			var args = arguments;
			context = context || this;

			if (invokeAsap && !timer) {
				fn.apply(context, args);
			}

			clearTimeout(timer);

			timer = setTimeout(function() {
				if (!invokeAsap) {
					fn.apply(context, args);
				}

				timer = null;

			}, timeout);

		};
	}

	function throttle(fn, timeout, context) {
		var timer, args;

		return function() {
			if (timer) {
				return;
			}

			args = arguments;
			context = context || this;
			fn.apply(context, args);
			timer = setTimeout(function() { timer = null; }, timeout);
		};
	}


	/* parsing like: ' a = fn1(), b = fn2()' into {a: 'fn1()', b: 'fn2()'} */

	function parseStringAsVars(str) {
		if (!str) {
			return undefined;
		}

		var a = str.replace(/\s/g,'').split(','), ret = {};

		for( var i = 0; i < a.length; i++ ) {
			a[i] = a[i].split('=');
			ret[a[i][0]] = a[i][1];
		}

		return ret;
	}

	function avgPerf (fn1, timeout, context, callback) {
		context = context || this;
		timeout = timeout || 1000;
		callback = callback || function(val) {
				console.log(val);
			};

		var time = [];

		var fn2 = debounce(function() {
			var sum = 0;

			for(var i=0; i < time.length; i++) {
				sum += time[i];
			}

			callback( Math.round(sum / time.length) );

			time = [];

		}, timeout);

		return function() {
			var start = Date.now();

			fn1.apply(context, arguments);

			time.push(Date.now() - start);

			fn2();

		};
	}

	function roundNumber(number, n) {
		if (isNaN(n)) {
			n=0;
		}

		var m = Math.pow(10,n);
		return Math.round(number * m) / m;
	}


	/* POINT OBJECT */

	var Point = (function() {
		function Point(x, y) {
			if (typeof x === 'object') {
				y = x.y || x.top;
				x = x.x || x.left;
			}

			this.x = x || 0;
			this.y = y || 0;
		}

		Point.prototype = {
			equal: function(other) {
				if (!(other instanceof Point)) {
					other = new Point(other);
				}

				return this.x === other.x && this.y === other.y;
			},
			plus: function(other) {
				if (!(other instanceof Point)) {
					other = new Point(other);
				}

				return new Point(this.x + other.x, this.y + other.y);
			},
			minus: function(other) {
				if (!(other instanceof Point)) {
					other = new Point(other);
				}

				return new Point(this.x - other.x, this.y - other.y);
			},
			scale: function(scalar) {
				return new Point(this.x * scalar, this.y * scalar);
			},
			magnitude: function() {
				return this.distance(new Point(0, 0), this);
			},
			distance: function(other) {
				if (!(other instanceof Point)) {
					other = new Point(other);
				}

				return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
			},
			angle: function (other, isdegree) {
				var ret = Math.atan2(
					other.y - this.y,
					other.x - this.x
				);

				if (isdegree===true) {
					ret *= 180/Math.PI;
				}

				return ret;
			},
			deltaAngle: function(other, aboutPoint, isdegree) {
				aboutPoint = aboutPoint === undefined ? {x:0,y:0} : aboutPoint;
				var ret = this.angle(aboutPoint) - other.angle(aboutPoint);

				if (ret < 0) {
					ret = Math.PI*2 + ret;
				}

				if (isdegree===true) {
					ret *= 180/Math.PI;
				}

				return ret;
			},
			transform: function(matrix) {
				return matrix.transformPoint(this);
			},
			deltaTransform: function(matrix) {
				return matrix.deltaTransformPoint(this);
			},
			rotate: function(rads, aboutPoint) {
				var matrix = (new Matrix()).rotate(rads, aboutPoint);

				return this.transform(matrix);
			},
			getAsCss: function() {
				return {
					top: this.y,
					left: this.x
				};
			}
		};

		return function(x,y) {
			return new Point(x,y);
		};
	})();



	/* MATRIX OBJECT */

	var Matrix = (function() {
		function Matrix(a, b, c, d, tx, ty) {
			this.a = a !== undefined ? a : 1;
			this.b = b || 0;
			this.c = c || 0;
			this.d = d !== undefined ? d : 1;
			this.tx = tx || 0;
			this.ty = ty || 0;
		}

		Matrix.prototype = {
			concat: function(other) {
				return new Matrix(
					this.a * other.a + this.c * other.b,
					this.b * other.a + this.d * other.b,
					this.a * other.c + this.c * other.d,
					this.b * other.c + this.d * other.d,
					this.a * other.tx + this.c * other.ty + this.tx,
					this.b * other.tx + this.d * other.ty + this.ty
				);
			},
			inverse: function() {
				var determinant = this.a * this.d - this.b * this.c;

				return new Matrix(
					this.d / determinant,
					-this.b / determinant,
					-this.c / determinant,
					this.a / determinant,
					(this.c * this.ty - this.d * this.tx) / determinant,
					(this.b * this.tx - this.a * this.ty) / determinant
				);
			},
			rotate: function(theta, aboutPoint) {
				var rotationMatrix = new Matrix(
					Math.cos(theta),
					Math.sin(theta),
					-Math.sin(theta),
					Math.cos(theta)
				);

				if (aboutPoint) {
					rotationMatrix = this.translate(aboutPoint.x, aboutPoint.y).concat(rotationMatrix).translate(-aboutPoint.x, -aboutPoint.y);
				}

				return this.concat(rotationMatrix);
			},
			scale: function(sx, sy, aboutPoint) {
				sy = sy || sx;

				var scaleMatrix = new Matrix(sx, 0, 0, sy);

				if (aboutPoint) {
					scaleMatrix = scaleMatrix.translate(aboutPoint.x, aboutPoint.y).translate(-aboutPoint.x, -aboutPoint.y);
				}

				return scaleMatrix;
			},
			translate: function(tx, ty) {
				var translateMatrix = new Matrix(1, 0, 0, 1, tx, ty);

				return this.concat(translateMatrix);
			},

			transformPoint: function(point) {
				return new Point(
					this.a * point.x + this.c * point.y + this.tx,
					this.b * point.x + this.d * point.y + this.ty
				);
			},
			deltaTransformPoint: function(point) {
				return new Point(
					this.a * point.x + this.c * point.y,
					this.b * point.x + this.d * point.y
				);
			},
			toStyle: function() {
				var a = roundNumber(this.a, 3),
					b = roundNumber(this.b, 3),
					c = roundNumber(this.c, 3),
					d = roundNumber(this.d, 3),
					tx = roundNumber(this.tx, 3),
					ty = roundNumber(this.ty, 3),
					result = 'matrix(' + a + ', ' + b + ', ' + c + ', ' + d + ', ' + tx +', ' + ty + ')';

				return result === 'matrix(1, 0, 0, 1, 0, 0)' ? 'none' : result;
			}
		};

		var fn = function(a, b, c, d, tx, ty) {
			return new Matrix(a, b, c, d, tx, ty);
		};

		fn.IDENTITY = new Matrix();
		fn.HORIZONTAL_FLIP = new Matrix(-1, 0, 0, 1);
		fn.VERTICAL_FLIP = new Matrix(1, 0, 0, -1);

		return fn;
	}());

	/* RECT OBJECT */

	var Rect = (function() {
		function Rect(tl, tr, bl, br) {
			this.tl = tl;
			this.tr = tr;
			this.bl = bl;
			this.br = br;
		}

		Rect.prototype = {
			applyMatrix: function(matrix, aboutPoint) {
				var tl, tr, bl, br,
					translateIn = new Matrix(1,0,0,1,aboutPoint.x,aboutPoint.y),
					translateOut = new Matrix(1,0,0,1,-aboutPoint.x,-aboutPoint.y);

				if (aboutPoint !== undefined) {
					tl = this.tl.transform(translateOut).transform(matrix).transform(translateIn);
					tr = this.tr.transform(translateOut).transform(matrix).transform(translateIn);
					bl = this.bl.transform(translateOut).transform(matrix).transform(translateIn);
					br = this.br.transform(translateOut).transform(matrix).transform(translateIn);
				} else {
					tl = this.tl.transform(matrix);
					tr = this.tr.transform(matrix);
					bl = this.bl.transform(matrix);
					br = this.br.transform(matrix);
				}

				return new Rect(tl, tr, bl, br);
			},
			width: function() {
				var dx = this.tl.x - this.tr.x;
				var dy = this.tl.y - this.tr.y;
				return Math.sqrt(dx*dx+dy*dy);
			},
			height: function() {
				var dx = this.tl.x - this.bl.x;
				var dy = this.tl.y - this.bl.y;
				return Math.sqrt(dx*dx+dy*dy);
			},
			client: function() {
				var top = Math.min(this.tl.y, this.tr.y, this.bl.y, this.br.y);
				var left = Math.min(this.tl.x, this.tr.x, this.bl.x, this.br.x);
				var height = Math.max(this.tl.y, this.tr.y, this.bl.y, this.br.y)-top;
				var width = Math.max(this.tl.x, this.tr.x, this.bl.x, this.br.x)-left;

				return {
					top: roundNumber(top,1),
					left: roundNumber(left,1),
					height: roundNumber(height,1),
					width: roundNumber(width,1),
					bottom: roundNumber(top+height, 1),
					right: roundNumber(left+width, 1)
				};
			},
			getAngle: function(degs) {
				var y = this.tl.y-this.tr.y;
				var x = this.tl.x-this.tr.x;

				return Math.tan(x/y)*180/Math.PI;
			}
		};

		var fn = function(left, top, width, height) {
			var args = arguments;

			if (typeof args[0] === 'object') {
				top = args[0].top;
				left = args[0].left;
				width = args[0].width;
				height = args[0].height;
			}

			return new Rect(
				new Point(left,top),
				new Point(left+width,top),
				new Point(left,top+height),
				new Point(left+width,top+height)
			);
		};

		fn.fromPoints = function(tl,tr,bl,br) {
			return new Rect( tl,tr,bl,br );
		};

		return fn;
	})();

	/* JQLITE EXTENDING */

	extend($.prototype, {

		dndDisableSelection: function() {
			this.on('dragstart selectstart', doFalse ).dndCss({
				'-moz-user-select': 'none',
				'-khtml-user-select': 'none',
				'-webkit-user-select': 'none',
				'-o-user-select': 'none',
				'-ms-user-select': 'none',
				'user-select': 'none'
			});
		},

		dndEnableSelection: function() {
			this.off('dragstart selectstart', doFalse ).dndCss({
				'-moz-user-select': 'auto',
				'-khtml-user-select': 'auto',
				'-webkit-user-select': 'auto',
				'-o-user-select': 'auto',
				'-ms-user-select': 'auto',
				'user-select': 'auto'
			});
		},

		dndClientRect: function() {
			if (!this[0]) {
				return;
			}

			var DOMRect = this[0] === window ? {top:0,bottom:0,left:0,right:0,width:0,height:0} : this[0].getBoundingClientRect();

			return {
				bottom: DOMRect.bottom,
				height: DOMRect.height,
				left: DOMRect.left,
				right: DOMRect.right,
				top: DOMRect.top,
				width: DOMRect.width,
			};
		},

		dndStyleRect: function() {
			var styles = this.dndCss(['width','height','top','left']);

			var width = parseFloat(styles.width);
			var height = parseFloat(styles.height);

			var top = styles.top === 'auto' ? 0 : parseFloat(styles.top);
			var left = styles.left === 'auto' ? 0 : parseFloat(styles.left);

			return {top: top, right: left+width, bottom: top+height, left: left, width: width, height: height};
		},

		dndGetParentScrollArea: function() {
			var ret = [], parents = this.dndClosest(), scrollX, clientX, scrollY, clientY, paddingX, paddingY, paddings, htmlEl = document.documentElement;

			forEach(parents, function(element) {

				paddings = $(element).dndCss(['padding-top', 'padding-right', 'padding-bottom', 'padding-left']);

				scrollX = element.scrollWidth;
				clientX = element.clientWidth;
				scrollY = element.scrollHeight;
				clientY = element.clientHeight;

				paddingY = parseFloat(paddings['padding-top']) + parseFloat(paddings['padding-bottom']);
				paddingX = parseFloat(paddings['padding-left']) + parseFloat(paddings['padding-right']);

				if ( scrollX - paddingX !== clientX || scrollY - paddingY !== clientY ) {
					ret.push(element);
				}
			});

			ret.push(window);

			return $(ret);
		},

		dndGetFirstNotStaticParent: function() {
			var ret, position, parents = this.dndClosest();

			forEach(parents, function(element) {

				position = $(element).dndCss('position');

				if ( position === 'absolute' || position === 'relative' || position === 'fixed' ) {
					ret = element;
					return false;
				}
			});

			if (!ret) {
				ret = document.documentElement;
			}

			return $(ret);
		},

		dndClosest: function(selector) {
			selector = selector || '*';
			var parent = this[0], ret = [];

			while(parent) {
				parent[MATCHES_SELECTOR](selector) && ret.push(parent);
				parent = parent.parentElement;
			}

			return $(ret);
		},
		dndGetAngle: function (degs) {
			var matrix = this.dndCss(TRANSFORM);

			if (matrix === 'none' || matrix === '') {
				return 0;
			}

			var values = matrix.split('(')[1].split(')')[0].split(','),
				a = values[0], b = values[1], rads = Math.atan2(b, a);

			rads = rads < 0 ? rads +=Math.PI*2 : rads;

			return degs ? Math.round(rads * 180/Math.PI) : rads;
		},

		dndCloneByStyles: function () {
			var ret = [];

			for (var i = 0, length = this.length; i < length; i++) {
				var node = this[i].cloneNode();
				var childNodes = angular.element(this[i].childNodes).dndCloneByStyles();

				angular.element(node).append(childNodes);

				if (node.nodeType === 1) {
					node.style.cssText = window.getComputedStyle(this[i], "").cssText;
				}

				ret.push(node);
			}

			return angular.element(ret);
		},

		dndCss: (function() {
			var SPECIAL_CHARS_REGEXP = /([\:\-\_\.]+(.))/g,
				MOZ_HACK_REGEXP = /^moz([A-Z])/, hooks = {};

			function toCamelCase(string) {
				return string.replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
					return offset ? letter.toUpperCase() : letter;
				}).replace(MOZ_HACK_REGEXP, 'Moz$1');
			}

			(function() {
				var arr = {
					width: ['paddingLeft','paddingRight','borderLeftWidth', 'borderRightWidth'],
					height: ['paddingTop','paddingBottom','borderTopWidth', 'borderBottomWidth']
				};

				forEach(arr, function(styles, prop) {

					hooks[prop] = {
						get: function(element) {
							var computed = window.getComputedStyle(element);
							var ret =  computed[prop];

							if ( computed.boxSizing !== 'border-box' || ret[ret.length-1] === '%') {
								return ret;
							}

							ret = parseFloat(ret);

							for(var i = 0; i < styles.length; i++) {
								ret -= parseFloat(computed[ styles[i] ]);
							}

							return ret + 'px';
						}
					};

				});

			})();

			var cssNumber = {
				'columnCount': true,
				'fillOpacity': true,
				'fontWeight': true,
				'lineHeight': true,
				'opacity': true,
				'order': true,
				'orphans': true,
				'widows': true,
				'zIndex': true,
				'zoom': true
			};

			var setCss = function($element, obj) {
				var styles = {};

				for(var key in obj) {
					var val = obj[key];

					if ( typeof val === 'number' && !cssNumber[key] ) {
						val += 'px';
					}

					styles[toCamelCase(key)] = val;
				}

				$element.css(styles);

				return $element;
			};

			var getCss = function($element, arg) {
				var ret = {};

				if (!$element[0]) {
					return undefined;
				}

				var style = $element[0].style;
				var computed = window.getComputedStyle( $element[0], null );

				if (typeof arg === 'string') {
					if (style[arg]) {
						return style[arg];
					} else {
						return hooks[arg] && 'get' in hooks[arg] ? hooks[arg].get($element[0]) : computed.getPropertyValue( arg );
					}
				}

				for(var i=0; i < arg.length; i++) {
					if (style[arg[i]]) {
						ret[arg[i]] = style[ arg[i] ];
					} else {
						ret[arg[i]] = hooks[arg[i]] && 'get' in hooks[arg[i]] ? hooks[arg[i]].get($element[0]) : computed.getPropertyValue( arg[i] );
					}
				}

				return ret;
			};

			function css() {
				var a = arguments;

				if ( (a.length === 1) && ((a[0] instanceof Array) || (typeof a[0] === 'string')) ) {
					return getCss(this, a[0]);
				} else if ( (a.length === 1) && (typeof a[0] === 'object') ) {
					return setCss(this, a[0]);
				} else if ( a.length === 2 ) {
					var obj = {};

					obj[a[0]] = a[1];

					return setCss(this, obj);
				}

				return this;

			}

			return css;
		})()
	});

	/* INIT ANGULAR MODULE */

	var module = angular.module('dnd', []);

	/* ANGULAR.ELEMENT DND PLUGIN - CORE OF ANGULAR-DND */

	(function() {

		var Regions = (function() {
			var list = {};

			function Regions(layer) {
				if (!list[layer]) {
					list[layer] = [];
				}

				this.layer = function() {
					return layer;
				};
			}

			Regions.prototype = {
				get: function() {
					return list[this.layer()];
				},

				remove: function(el) {
					var index = this.get().indexOf(el);

					if (index > -1) {
						this.get().splice(index,1);
					}
				},

				has: function(el) {
					return this.get().indexOf(el) > -1;
				},

				add: function(el) {
					if (this.has(el)) {
						return;
					}

					this.get().push(el);

					var self = this;

					$(el).on('$destroy', function() { self.remove(el); });
				},

			};

			return Regions;
		})();

		var Dnd = (function() {

			var events = [ 'dragstart', 'drag', 'dragend', 'dragenter', 'dragover', 'dragleave', 'drop' ];
			var draggables = [ 'dragstart', 'drag', 'dragend' ];
			var droppables = [ 'dragenter', 'dragover', 'dragleave', 'drop' ];
			var handled = false;

			draggables.has = droppables.has = function(event) {
				return this.indexOf(event) > -1;
			};

			var touchevents;
			if ('ontouchstart' in document.documentElement) {
				touchevents = {start: 'touchstart', move: 'touchmove', end: 'touchend', cancel: 'touchcancel'};
			} else if ('pointerEnabled' in window.navigator) {
				touchevents = {start: 'pointerdown', move: 'pointermove', end: 'pointerup', cancel: 'pointercancel'};
			} else if ('msPointerEnabled' in window.navigator) {
				touchevents = {start: 'MSPointerDown', move: 'MSPointerMove', end: 'MSPointerUp', cancel: 'MSPointerCancel'};
			} else {
				touchevents = {start: 'touchstart', move: 'touchmove', end: 'touchend', cancel: 'touchcancel'};
			}

			function Dnd(el, layer) {
				this.el = el;
				this.$el = $(el);
				this.listeners = { 'dragstart':[], 'drag':[], 'dragend':[], 'dragenter':[], 'dragover':[], 'dragleave':[], 'drop':[] };
				this.regions = new Regions(layer);
				this.layer = function() {
					return layer;
				};
				this.setCurrentManipulator(null);
			}

			Dnd.prototype = {
				_isEmptyListeners: function(event) {
					if (event instanceof Array) {

						for(var i=0; i < event.length; i++ ) {
							if (!this._isEmptyListeners(event[i])) {
								return false;
							}
						}

					} else if (this.listeners[event].length > 0) {
						return false;
					}

					return true;
				},

				addListener: function(event, handler) {
					if (events.indexOf(event) === -1) {
						console.error('jquery.dnd: invalid event name - ', event);
						return this;
					}
					this.listeners[event].push( handler);

					if ( droppables.has(event) ) {
						this.regions.add(this.el);
					} else if (draggables.has(event) && !this.mouse && !this.touch) {
						if ('onmousedown' in window) {
							this.mouse = new Mouse(this);
						}
						if ( ('ontouchstart' in window) || ('onmsgesturechange' in window) ) {
							this.touch = new Touch(this, touchevents);
						}

					}

					return this;
				},

				removeListener: function(event, handler) {
					var args = arguments;

					if (args.length === 0) {
						for( var key in this.listeners ) {
							this.listeners[key].length = 0;
						}
					} else if (args.length === 1) {
						this.listeners[event].length = 0;
					} else {
						var listeners = this.listeners[event];

						for(var i=0; i < listeners.length; i++) {
							if ( listeners[i] === handler ) listeners[event].splice(i,1);
						}

					}

					if ( this._isEmptyListeners(droppables) ) this.regions.remove(this.el);
					else if ( this._isEmptyListeners(draggables)) this.destroy();

					return this;
				},

				trigger: function(event, api, el) {
					for(var i=0; i < this.listeners[event].length; i++) {
						this.listeners[event][i].call(this.$el, api,  el);
					}

					return this;
				},

				destroy: function() {
					if ( this.mouse ) {
						this.mouse.destroy();
						delete this.mouse;
					}

					if ( this.touch ) {
						this.touch.destroy();
						delete this.touch;
					}

					return this;
				},

				setCurrentManipulator: function (manipulator) {
					this._manipulator = manipulator;

					return this;
				},

				getCurrentManipulator: function () {
					return this._manipulator;
				}
			};


			return Dnd;
		})();

		var Api = (function() {

			function Api(manipulator) {
				this._manipulator = manipulator;
			}

			Api.prototype = {
				getAxis: function() {
					return this._manipulator.getClientAxis.apply(this._manipulator, arguments);
				},
				getBorderedAxis: function() {
					return this._manipulator.getBorderedAxis.apply(this._manipulator, arguments);
				},
				getRelBorderedAxis: function() {
					return this._manipulator.getRelBorderedAxis.apply(this._manipulator, arguments);
				},
				getDragTarget: function() {
					return this._manipulator.dnd.el;
				},
				getDropTarget: function() {
					return this._manipulator.target;
				},
				getEvent: function() {
					return this._manipulator.event;
				},
				isTarget: function() {
					return this._manipulator.isTarget.apply(this._manipulator, arguments);
				},
				unTarget: function() {
					this._manipulator.removeFromTargets();
				},
				useAsPoint: function(value) {
					return this._manipulator.asPoint = !(value === false);
				},
				setBounderElement: function(node) {
					this._manipulator.$bounder = angular.element(node);
					this.clearCache();
				},
				setReferenceElement: function(node) {
					this._manipulator.$reference = angular.element(node);
				},
				getBorders: function() {
					return this._manipulator.getBorders.apply(this._manipulator, arguments);
				},
				getReferencePoint: function() {
					return this._manipulator.getReferencePoint.apply(this._manipulator, arguments);
				},
				clearCache: function() {
					this._manipulator.clearCache.apply(this._manipulator, arguments);
				}
			};

			return Api;

		})();

		var Manipulator = (function() {
			var targets = [];

			function Manipulator(dnd) {
				this.dnd = dnd;
				this.onscroll = proxy(this, this.onscroll);
			}

			Manipulator.prototype = {

				getBorders: function(offset) {
					if (!this.$bounder) {
						return;
					}

					var borders  = this.getCache('borders');

					if (!borders) {
						var rect = this.$bounder.dndClientRect();

						borders = this.setCache('borders', {
							top: rect.top,
							left: rect.left,
							right: rect.right,
							bottom: rect.bottom
						});
					}

					return {
						top: borders.top + (offset ? offset.top : 0),
						left: borders.left + (offset ? offset.left : 0),
						right: borders.right + (offset ? offset.right : 0),
						bottom: borders.bottom + (offset ? offset.bottom : 0)
					};
				},

				getReferencePoint: function() {
					var referencePoint  = this.getCache('referencePoint');

					if (!referencePoint) {
						var rect = this.$reference.dndClientRect();

						referencePoint = this.setCache('referencePoint', new Point(rect.left, rect.top));
					}

					return referencePoint;
				},

				getBorderedAxis: function(borderOffset, axisOffset) {
					var axis = this.getClientAxis(axisOffset);
					var borders = this.getBorders(borderOffset);

					var result = borders ? new Point(
						getNumFromSegment(borders.left, axis.x, borders.right),
						getNumFromSegment(borders.top, axis.y, borders.bottom)
					) : axis;

					return result;
				},

				getRelBorderedAxis: function(borderOffset, axisOffset) {
					return this.getBorderedAxis(borderOffset, axisOffset).minus( this.getReferencePoint() );
				},

				addToTargets: function() {
					targets.push(this);
				},

				removeFromTargets: function() {
					var index;

					while(index !== -1) {
						index = targets.indexOf(this);
						if (index > -1) {
							targets.splice(index, 1);
						}
					}
				},

				getTarget: function() {
					return targets[0];
				},

				isTarget: function() {
					return this.getTarget() === this;
				},

				start: function() {
					this.started = true;
					this.targets = [];
					this.asPoint = false;
					this.api = new Api(this);
					this.$scrollareas = this.dnd.$el.dndGetParentScrollArea();
					this.$reference = this.dnd.$el.dndGetFirstNotStaticParent();
					this.$scrollareas.on('scroll', this.onscroll);
					this.dnd.trigger('dragstart', this.api);
				},

				onscroll: function() {
					this.clearCache();
					this.dnd.trigger('drag', this.api);
				},

				getCache: function(key) {
					return this.cache[key];
				},

				setCache: function(key, value) {
					return this.cache[key] = value;
				},

				clearCache: function() {
					this.cache = {};
				},

				stop: function() {
					this.$scrollareas.off ('scroll', this.onscroll);

					if (this.targets.length) {
						for(var i = 0, length = this.targets.length; i < length; i++) {
							$(this.targets[i]).data('dnd')[this.dnd.layer()].trigger('drop', this.api, this.dnd.el);
						}
					}

					this.dnd.trigger('dragend', this.api, this.targets);
				},


				prepareRegions: function() {
					var regions = this.dnd.regions.get();

					var ret = [];

					for(var key in regions) {
						var dnd = $( regions[key] ).data('dnd')[this.dnd.layer()];
						var rect = dnd.$el.dndClientRect();

						if (this.dnd === dnd) {
							continue;
						}

						ret.push({
							dnd: dnd,
							rect: rect
						});
					}

					return ret;

				},

				begin: function (event) {
					if (this.dnd.getCurrentManipulator() ||
						$(event.target).dndClosest('[dnd-pointer-none]').length) {
						return false;
					}

					this.dnd.setCurrentManipulator(this);

					this.addToTargets();
					this.event = event;
					this.started = false;
					this.clearCache();
					angular.element(document.body).dndDisableSelection();

					return true;
				},

				_isTriggerByPoint: function (p, r) {
					return (p.x > r.left) && (p.x < r.right) && (p.y > r.top) && (p.y < r.bottom);
				},

				_isTriggerByRect: function (a, b) {
					return a.top <= b.top && b.top <= a.bottom && ( a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right ) ||
						a.top <= b.bottom && b.bottom <= a.bottom && ( a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right ) ||
						a.left >= b.left && a.right <= b.right && ( b.top <= a.bottom && a.bottom <= b.bottom ||  b.bottom >= a.top && a.top >= b.top || a.top <= b.top && a.bottom >= b.bottom) ||
						a.top >= b.top && a.bottom <= b.bottom && ( b.left <= a.right && a.right <= b.right || b.right >= a.left && a.left >= b.left || a.left <= b.left && a.right >= b.right) ||
						a.top >= b.top && a.right <= b.right && a.bottom <= b.bottom && a.left >= b.left
				},

				progress: function (event) {
					this.event = event;

					if (!this.started) {
						this.start();
					}

					var regions = this.getCache('regions');

					if (!regions) {
						regions = this.setCache('regions', this.prepareRegions());
						if (debug.mode) {
							this.showRegioins();
						}
					}

					this.dnd.trigger('drag', this.api);

					var isTrigger = this.asPoint ? this._isTriggerByPoint.bind(this, this.getBorderedAxis()) :
						this._isTriggerByRect.bind(this, angular.element(this.dnd.el).dndClientRect());
					var dragenter = [];
					var dragover = [];
					var dragleave = [];

					for(var i = 0; i < regions.length; i++) {
						var region = regions[i],
							trigger = isTrigger(region.rect),
							targetIndex = this.targets.indexOf(region.dnd.el);

						if ( trigger ) {
							if (targetIndex === -1) {
								this.targets.push(region.dnd.el);
								dragenter.push(region.dnd);
							} else {
								dragover.push(region.dnd);
							}
						} else if (targetIndex !== -1) {
							dragleave.push($(this.targets[targetIndex]).data('dnd')[this.dnd.layer()]);
							this.targets.splice(targetIndex, 1);
						}
					}

					this._triggerArray(dragleave, 'dragleave');
					this._triggerArray(dragenter, 'dragenter');
					this._triggerArray(dragover, 'dragover');
				},

				_triggerArray: function (arr, event) {
					for (var i = 0; i < arr.length; i++) {
						arr[i].trigger(event, this.api, this.dnd.el);
					}
				},

				end: function (event) {
					this.event = event;

					if (this.started) {
						this.stop();
					}

					angular.element(document.body).dndEnableSelection();

					this.removeFromTargets();

					debug.mode && this.hideRegions();

					this.dnd.setCurrentManipulator(null);
				},

				showRegioins: function () {
					this.hideRegions();

					var regions = this.getCache('regions'),
						bodyElement = angular.element(document.body),
						bodyClientRect = bodyElement.dndClientRect();

					for (var i = 0, length = regions.length; i < length; i++) {
						var region = regions[i];

						debug.helpers.renderRect(
							region.rect.left - bodyClientRect.left,
							region.rect.top - bodyClientRect.top,
							region.rect.width,
							region.rect.height
						);
					}
				},

				hideRegions: function () {
					var nodes = document.querySelectorAll('.dnd-debug-rect');

					for (var i = 0, length = nodes.length; i < length; i++) {
						nodes[i].remove();
					}
				}
			};

			return Manipulator;
		})();

		function Mouse(dnd) {
			this.dnd = dnd;
			this.manipulator = new Manipulator(dnd);
			this.mousedown = proxy(this, this.mousedown);
			this.mousemove = proxy(this, this.mousemove);
			this.mouseup = proxy(this, this.mouseup);
			this.manipulator.getClientAxis = this.getClientAxis;

			dnd.$el.on('mousedown', this.mousedown);
		}

		Mouse.prototype = {

			getClientAxis: function(offset) {
				return new Point(this.event.clientX + (offset ? offset.x : 0), this.event.clientY + (offset ? offset.y : 0));
			},

			mousedown: function (event) {
				if (!this.manipulator.begin(event)) {
					return;
				}

				$document.on('mousemove', this.mousemove );
				$document.on('mouseup', this.mouseup );
			},

			mousemove: function(event) {
				this.manipulator.progress(event);
			},

			mouseup: function(event) {
				this.manipulator.end(event);

				$document.off('mousemove', this.mousemove );
				$document.off('mouseup', this.mouseup );

				this.dnd.setCurrentManipulator(null);
			},

			destroy: function() {
				this.dnd.$el.off('mousedown', this.mousedown);
			},
		};


		function Touch(dnd, te) {
			this.dnd = dnd;
			this.te = te;
			this.manipulator = new Manipulator(dnd);
			this.touchstart = proxy(this, this.touchstart);
			this.touchmove = proxy(this, this.touchmove);
			this.touchend = proxy(this, this.touchend);
			this.manipulator.getClientAxis = this.getClientAxis;

			dnd.$el.on(this.te.start, this.touchstart);
		}

		Touch.prototype = {

			getClientAxis: function(offset) {
				var event = this.event.originalEvent || this.event;

				return event.changedTouches ?
					Point(event.changedTouches[0].clientX + (offset ? offset.x : 0), event.changedTouches[0].clientY + (offset ? offset.y : 0)) :
					Point(event.clientX + (offset ? offset.x : 0), event.clientY + (offset ? offset.y : 0));
			},

			touchstart: function (event) {
				if (!this.manipulator.begin(event)) {
					return;
				}

				$document.on(this.te.move, this.touchmove );
				$document.on(this.te.end + ' ' + this.te.cancel, this.touchend );
			},

			touchmove: function(event) {
				if (this.manipulator.isTarget()) {
					event.preventDefault();
				}

				this.manipulator.progress(event);
			},

			touchend: function(event) {
				this.manipulator.end(event);

				$document.off(this.te.move, this.touchmove );
				$document.off(this.te.end + ' ' + this.te.cancel, this.touchend );
				this.dnd.setCurrentManipulator(null);
			},

			destroy: function() {
				this.dnd.$el.off(this.te.start, this.touchstart);
			}
		};

		/**
		 * @name angular.element.dndBind
		 *
		 * @description
		 * Аналог jQuery.fn.bind(), только для drag and drop событий
		 *
		 * События также могут быть в формате <layer.event>,
		 * но в отличие от jQuery.fn.bind() в нашем случае layer позволяет не только групировать обработчики,
		 * но также и отделять области для droppable и draggable элементов. Поясним.
		 * Дело в том, что при определении событий элемент не явным образом приписывается к определенной области видимости (layer),
		 * причем один элемент может одновременно находится в нескольких областях.
		 * Это означает, что для того, чтобы на элемент срабатывали droppable события, он должен находится в layer draggable элемента.
		 * По умолчанию, если layer не задан в наименовании обаботчика события, то эта область именуется 'common',
		 * т.е. события drop и common.drop идентичны и находятся в одной и той же области
		 *
		 * ! Элемент не явным образом считается draggable-элементом, если у него задано одно или несколько событий dragstart, drag или dragend
		 * ! Элемент не явным образом считается droppable-элементом, если у него задано одно или несколько событий dragenter, dragover, dragleave или drop
		 *
		 * @param {object|string} event
		 * Если object, то необходимо описать пары <event name>:<callback function>.
		 * Если string, то определяется только <event name> причем возможно задать несколько событий через пробел, например <dragstart drag leftside.dragend>
		 * @param {function} handler
		 * Если arg1 это string, то arg2 это callback, который будет вызван после наступления события.
		 * @returns {object} angular.element object.
		 */

		$.prototype.dndBind = function ( event, handler ) {

			if (!this.length) {
				return this;
			}

			var opts = [], events, obj, layer, self = this;

			if (typeof event === 'object') {
				obj = event;

				for(var key in obj) {
					events = key.replace(/\s+/g, ' ').split(' ');

					for(var i=0; i < events.length; i++) {
						opts.push({
							event: events[i],
							handler: obj[key]
						});
					}
				}

			} else if (typeof event === 'string' && typeof handler === 'function') {
				events = event.trim().replace(/\s+/g, ' ').split(' ');

				for(var i=0; i < events.length; i++) {
					opts.push({
						event: events[i],
						handler: handler
					});
				}

			} else {
				return this;
			}

			if (!opts.length) {
				return this;
			}

			forEach(this, function(element) {
				var data = $(element).data();

				if (!data.dnd) {
					data.dnd = {};
				}

				for(var i=0; i < opts.length; i++) {
					event = opts[i].event;
					handler = opts[i].handler;

					event = event.split('.');

					if (event[1] === undefined) {
						event[1] = event[0];
						event[0] = 'common';
					}

					layer = event[0];
					event = event[1];

					if (!data.dnd[layer]) {
						data.dnd[layer] = new Dnd(element, layer);
					}

					data.dnd[layer].addListener(event, handler);
				}
			});

			return this;
		};


		/**
		 * @name angular.element.dndUnbind
		 *
		 * @description
		 * Аналог jQuery.fn.unbind(), только для drag and drop событий
		 *
		 * @param {(object=|string=)} arg1 Если не object и не string, то удаляются все обработчики с каждого слоя
		 *         Если object, то будут удалены callbacks события которые заданы в виде ключа и
		 * @param {(function=|string=)} arg2
		 *         Если arg1 это string, то arg2 это callback, который будет вызван после наступления события.
		 *         Если arg1 это object, то arg2 это string которая определяет имя используемого слоя.
		 * @param {string=} arg3
		 *         Если задан arg1 и arg2, то arg3 это string которая определяет имя используемого слоя
		 * @returns {object} angular.element object.
		 */

		$.prototype.dndUnbind =  function() {

			var args = arguments, events = [], default_layer = 'common';

			if (!this.length) {
				return this;
			}

			if (typeof args[0] === 'string') {

				args[0] = args[0].trim().replace(/\s+/g, ' ').split(' ');

				if (typeof args[1] === 'function') {

					for(var i = 0; i < args[0].length; i++) {
						events.push({
							event: args[0][i],
							handler: args[1]
						});
					}

				} else {
					for(var i = 0; i < args[0].length; i++) {
						events.push({
							event: args[0][i]
						});
					}
				}

			} else if ( typeof args[0] === 'object') {

				for(var key in args[0]) {
					if (args[0].hasOwnProperty(key)) {

						events.push({
							event: key.trim(),
							handler: args[0][key]
						});

					}
				}

			} else if (args.length !== 0) {
				return this;
			}

			forEach(this, function(element) {
				var data = $(element).data();

				if (!data.dnd) {
					return;
				}

				if (args.length === 0) {

					for(var key in data.dnd) {
						data.dnd[key].removeListener();
					}

				} else {

					for(var i = 0; i < events.length; i++) {
						var obj = events[i];

						obj.event = obj.event.split('.');

						if (obj.event[1] === undefined) {
							obj.event[1] = obj.event[0];
							obj.event[0] = default_layer;
						}

						if (obj.event[0] === '*') {
							for(var key in data.dnd) {
								data.dnd[key].removeListener( obj.event[1] );
							}

						} else if (data.dnd[ obj.event[0] ]) {
							obj.handler ? data.dnd[ obj.event[0] ].removeListener( obj.event[1], obj.handler ) : data.dnd[ obj.event[0] ].removeListener( obj.event[1] );
						}
					}
				}
			});

			return this;
		};

	})();

	/* DEBUG HELPERS */

	debug.helpers.renderPoint = function (point) {
		var element = angular.element(document.createElement('div'));

		element.dndCss({
			position: 'absolute',
			left: point.x,
			top:  point.y,
			height: 3,
			width: 3,
			background: 'rgba(0, 0, 0, 0.5)',
			'pointer-events': 'none',
			'z-index': 100000
		});

		element.addClass('dnd-debug-point');

		angular.element(document.body).append(element);
	};

	debug.helpers.renderRect = function (left, top, width, height) {
		var element = angular.element(document.createElement('div'));

		element.dndCss({
			position: 'absolute',
			left: left,
			top:  top,
			height: height,
			width: width,
			background: 'rgba(249, 255, 0, 0.1)',
			'pointer-events': 'none',
			'z-index': 100000,
			'box-sizing': 'border-box',
			'border': '2px dotted #000'
		});

		element.addClass('dnd-debug-rect');

		angular.element(document.body).append(element);
	};

	angular.dnd = {
		version: version,
		noop: noop,
		doTrue: doTrue,
		doFalse: doFalse,
		proxy: proxy,
		radToDeg: radToDeg,
		degToRad: degToRad,
		getNumFromSegment: getNumFromSegment,
		findEvents: findEvents,
		throttle: throttle,
		debounce: debounce,
		debug: debug
	};



	;

	module.directive('dndDraggable', ['$timeout', '$parse', '$http', '$compile', '$q', '$templateCache', 'EventEmitter',
		function ($timeout, $parse, $http, $compile, $q, $templateCache, EventEmitter) {

			var ElementTarget = (function () {

				function ElementTarget(element, rect) {

					var cssPosition =  element.dndCss('position');

					if (cssPosition !== 'fixed' && cssPosition !== 'absolute' && cssPosition !== 'relative') {
						cssPosition = 'relative';
						element.dndCss('position', cssPosition);
					}

					this.element = element;

					this.rect = rect;
				}

				ElementTarget.prototype = {
					initBorderOffset: function () {
						var axis = this.api.getBorderedAxis();
						var crect = this.element.dndClientRect();

						this.borderOffset = {
							top: axis.y - crect.top,
							left: axis.x - crect.left,
							bottom: axis.y - crect.top - crect.height,
							right: axis.x - crect.left - crect.width
						};
					},

					init: function (api) {
						this.api = api;
						delete this.start;
						this.initBorderOffset();
					},

					updatePosition: function () {
						var axis = this.api.getRelBorderedAxis(this.borderOffset);

						if (!this.start) {
							this.start = new Point(this.element.dndStyleRect()).minus(axis);
						}

						var position = new Point(this.start).plus(axis);

						this.rect ? this.rect.update( position.getAsCss() ) : this.element.dndCss( position.getAsCss() );
					},

					destroy: function () {},
				};

				return ElementTarget;
			})();

			var HelperTarget = (function () {
				var wrapper = $('<div class = "angular-dnd-draggable-helper"></div>').dndCss({position: 'absolute'});

				function HelperTarget(mainNode, templateUrl, scope) {
					this.mainElement = angular.element(mainNode);
					this.scope = scope;
					this.templateUrl = templateUrl;

					if (templateUrl !== 'clone')  {
						this.createTemplateByUrl(templateUrl);
					} else {
						this.ready = true;
					}
				}

				HelperTarget.prototype = {

					init: function (api) {
						delete this.start;
						delete this.element;
						this.api = api;
						this.ready = false;

						this.templateUrl === 'clone' ? this.createElementByClone() : this.createElementByTemplate();

						this.wrap().appendTo($(document.body));

						if (!this.scope.$root || !this.scope.$root.$$phase) {
							this.scope.$apply();
						}

						api.setReferenceElement(document.body);
						this.initBorderOffset();

						return this;
					},

					createTemplateByUrl: function (templateUrl) {
						templateUrl = angular.isFunction (templateUrl) ? templateUrl() : templateUrl;

						return $http.get(templateUrl, {cache: $templateCache}).then(function (result) {
							this.template = result.data;
							this._offset = Point();
							this.ready = true;
						}.bind(this));
					},

					createElementByClone: function () {
						this.element = this.mainElement.dndCloneByStyles().dndCss('position', 'static');
						this._offset = Point(this.mainElement.dndClientRect()).minus(this.api.getBorderedAxis());
						this.ready = true;

						return this;
					},

					createElementByTemplate: function () {
						this.element = $compile(this.template)(this.scope);

						return this;
					},

					wrap: function () {
						wrapper.html('');
						wrapper.append(this.element);

						return this;
					},

					appendTo: function (element) {
						element.append(wrapper);

						return this;
					},

					initBorderOffset: function () {
						var axis = this.api.getBorderedAxis();

						if (this.templateUrl === 'clone') {
							var crect = this.mainElement.dndClientRect();

							this.borderOffset = {
								top: axis.y - crect.top,
								left: axis.x - crect.left,
								bottom: axis.y - crect.top - crect.height,
								right: axis.x - crect.left - crect.width
							};
						} else {
							var crect = wrapper.dndClientRect();

							this.borderOffset = {
								top: 0,
								left: 0,
								bottom: -crect.height,
								right: -crect.width
							};
						}
					},

					updatePosition: function () {
						var position = this.api.getRelBorderedAxis(this.borderOffset).plus(this._offset);

						wrapper.dndCss(position.getAsCss());
					},


					destroy: function () {
						this.element.remove();
					},
				};

				return HelperTarget;
			})();

			function link (scope, element, attrs, ctrls) {
				var rect = ctrls[0],
					model = ctrls[1],
					containment = ctrls[2];

				var defaults = {
					layer: 'common',
					useAsPoint: true,
					helper: null,
					handle: ''
				};

				var getterDraggable = $parse(attrs.dndDraggable);
				var opts = extend({}, defaults, $parse(attrs.dndDraggableOpts)(scope) || {});
				var dragstartCallback = $parse(attrs.dndOnDragstart);
				var dragCallback = $parse(attrs.dndOnDrag);
				var dragendCallback = $parse(attrs.dndOnDragend);
				var draggable = opts.helper ? new HelperTarget(element, opts.helper, scope) : new ElementTarget(element, rect);
				var started, handle = opts.handle ? element[0].querySelector(opts.handle) : '';

				function dragstart(api) {
					started = false;

					// определяем включен ли draggable элемент
					var enabled = getterDraggable(scope);
					enabled = enabled === undefined || enabled;

					// если draggable элемент выключен - отмечаем элемент как "не цель курсора"
					if (!enabled || (handle && handle !== api.getEvent().target)) {
						api.unTarget();
					}

					// если элемент не является целью курсора (возможно есть другие draggable элементы внутри) - никак не реагируем на событие
					if (!api.isTarget()) {
						return;
					}

					draggable.init(api);

					// ставим флаг, что элемент начал двигаться
					started = true;

					// ставим флаг useAsPoint, что бы определить, является ли элемент полноразмерным или точкой.
					// В зависимости от этого флага по разному реагируют droppable зоны на этот элемент
					api.useAsPoint(opts.useAsPoint);

					// задаем модель данному элементу
					api.dragmodel = model ? model.get() : null;

					api.setBounderElement( containment ? containment.get() : angular.element(document.body) );

					// ставим флаг, что процесс перемещения элемента начался
					scope.$dragged = true;

					// применяем пользовательский callback
					dragstartCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});

					// запускаем dirty-checking цикл
					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				function drag(api) {
					if (!started) {
						return;
					}

					draggable.updatePosition();
					dragCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply()
					}
				}

				function dragend(api) {
					if (!started) {
						return;
					}

					draggable.destroy();

					dragendCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});

					$timeout(function () {
						scope.$dragged = false;
					});
				}

				var bindings = {};

				opts.layer = opts.layer || defaults.layer;

				bindings[opts.layer+'.dragstart'] = dragstart;
				bindings[opts.layer+'.drag'] = drag;
				bindings[opts.layer+'.dragend'] = dragend;

				element.dndBind(bindings);

				scope.$dragged = false;
			}

			return {
				require: ['?dndRect', '?dndModel', '?dndContainment'],
				scope: true,
				link: link
			};
		}]);
	;

	module.directive('dndDroppable', ['$parse', '$timeout', function( $parse, $timeout ){
		return {
			require: '?dndModel',
			scope: true,
			link: function(scope, $el, attrs, model){

				var defaults = {
					layer: 'common'
				};

				var getterDroppable = $parse(attrs.dndDroppable);
				var opts = extend({}, defaults, $parse(attrs.dndDroppableOpts)(scope) || {});
				var dragenterCallback = $parse(attrs.dndOnDragenter);
				var dragoverCallback = $parse(attrs.dndOnDragover);
				var dragleaveCallback = $parse(attrs.dndOnDragleave);
				var dropCallback = $parse(attrs.dndOnDrop);

				function dragenter(api){
					var local = api.droplocal = {};

					api.dropmodel = model ? model.get() : model;

					local.droppable = getterDroppable(scope, {'$dragmodel': api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});
					local.droppable = local.droppable === undefined ? true : local.droppable;

					if(!local.droppable) {
						return;
					}

					dragenterCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				function dragover(api){
					var local = api.droplocal;

					if(!local.droppable) {
						return;
					}

					dragoverCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				function dragleave(api){
					var local = api.droplocal;

					if(!local.droppable) {
						return;
					}

					dragleaveCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});
					api.dropmodel = undefined;

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				function drop(api){
					var local = api.droplocal;

					if(!local.droppable) {
						return;
					}

					dropCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});
				}


				var bindings = {};

				opts.layer = opts.layer || defaults.layer;

				bindings[opts.layer+'.dragenter'] = dragenter;
				bindings[opts.layer+'.dragover'] = dragover;
				bindings[opts.layer+'.dragleave'] = dragleave;
				bindings[opts.layer+'.drop'] = drop;

				$el.dndBind( bindings );

			}
		};
	}]);
	;

	module.directive('dndRotatable', ['$parse', '$timeout', function($parse, $timeout){

		function link (scope, element, attrs, ctrls) {
			var rect = ctrls[0],
				containment = ctrls[1];

			var defaults = {
				step: 5
			};

			var getterRotatable = $parse(attrs.dndRotatable);
			var opts = extend({}, defaults, $parse(attrs.dndRotatableOpts)(scope) || {});
			var dragstartCallback = $parse(attrs.dndOnRotatestart);
			var dragCallback = $parse(attrs.dndOnRotate);
			var dragendCallback = $parse(attrs.dndOnRotateend);

			var cssPosition = element.dndCss('position');

			if(cssPosition != 'fixed' && cssPosition != 'absolute' && cssPosition != 'relative') {
				cssPosition = 'relative';
				element.dndCss('position', cssPosition);
			}

			var handle = angular.element('<div class = "angular-dnd-rotatable-handle"></div>');

			element.append(handle);

			function dragstart(api) {
				var local = api.local = {};

				local.rotatable = getterRotatable(scope);
				local.rotatable = local.rotatable === undefined ? true : local.rotatable;

				if( !local.rotatable ) {
					api.unTarget();
				}

				if(!api.isTarget()) {
					return;
				}

				local.started = true;

				api.setBounderElement( containment ? containment.get() : angular.element(document.body) );

				var axis = api.getRelBorderedAxis();

				local.srect = element.dndStyleRect();

				local.currAngle = element.dndGetAngle();

				local.startPoint = Point(axis);

				local.borders = api.getBorders();

				local.center = Point(local.srect).plus(Point(local.srect.width / 2, local.srect.height / 2));

				scope.$rotated = true;

				dragstartCallback(scope);

				if (!scope.$root || !scope.$root.$$phase) {
					scope.$apply();
				}
			}

			function drag(api){
				var local = api.local;

				if(!local.started) {
					return;
				}

				var axis = api.getRelBorderedAxis();
				var angle = Point(axis).deltaAngle(local.startPoint, local.center);
				var degs = radToDeg(local.currAngle+angle);

				degs = Math.round(degs/opts.step)*opts.step;
				var rads = degToRad(degs);
				var matrix = Matrix().rotate(rads);

				var compute = Rect( local.center.x - local.srect.width/2, local.center.y - local.srect.height/2, local.srect.width, local.srect.height).applyMatrix( matrix, local.center ).client();
				var rPoint = api.getReferencePoint();

				if(local.borders && (compute.left + rPoint.x < local.borders.left-1 || compute.top + rPoint.y < local.borders.top-1 || (compute.left + rPoint.x + compute.width) > local.borders.right+1 || (compute.top + rPoint.y + compute.height) > local.borders.bottom+1)) {
					return;
				}

				if(rect) {
					rect.update('transform', matrix.toStyle());
				} else {
					element.dndCss('transform',  matrix.toStyle());
				}

				dragCallback(scope);

				if (!scope.$root || !scope.$root.$$phase) {
					scope.$apply();
				}
			}

			function dragend(api){
				var local = api.local;

				if(!local.started) {
					return;
				}

				dragendCallback(scope);

				$timeout(function(){
					scope.$rotated = false;
				});
			}

			scope.$rotated = false;

			var bindings = {
				'$$rotatable.dragstart': dragstart,
				'$$rotatable.drag': drag,
				'$$rotatable.dragend': dragend
			};

			handle.dndBind( bindings );

		}

		return {
			require: ['?dndRect', '?dndContainment'],
			scope: true,
			link: link
		};
	}])
	;

	module.directive('dndResizable', ['$parse', '$timeout', function($parse, $timeout) {

		function createHandleElement(side) {
			return angular.element('<div></div>').addClass('angular-dnd-resizable-handle angular-dnd-resizable-handle-' + side);
		}

		function getCenterPoint(rect, scale) {
			scale = typeof scale === 'object' ? scale : {x:1,y:1};

			return new Point(rect.left + rect.width*scale.x/2, rect.top + rect.height*scale.y/2);
		}

		function link (scope, $el, attrs, ctrls) {
			var rect = ctrls[0],
				containment = ctrls[1];

			var defaults = {
				handles: 'ne, se, sw, nw, n, e, s, w',
				minWidth: 20,
				minHeight: 20,
				maxWidth: 10000,
				maxHeight: 10000
			};

			var getterResizable = $parse(attrs.dndResizable);
			var opts = extend({}, defaults, $parse(attrs.dndResizableOpts)(scope) || {});
			var dragstartCallback = $parse(attrs.dndOnResizestart);
			var dragCallback = $parse(attrs.dndOnResize);
			var dragendCallback = $parse(attrs.dndOnResizeend);

			function getBindings(side) {

				function dragstart(api) {
					var local = api.local = {};

					local.resizable = getterResizable(scope);
					local.resizable = local.resizable === undefined ? true : local.resizable;

					if ( !local.resizable ) {
						api.unTarget();
					}

					if ( !api.isTarget() ) {
						return;
					}

					api.setBounderElement( containment ? containment.get() : angular.element(document.body) );
					local.started = true;
					local.$parent = $el.parent();
					local.rads = $el.dndGetAngle();
					local.rotateMatrix = Matrix.IDENTITY.rotate(local.rads);
					local.inverseRotateMatrix = local.rotateMatrix.inverse();
					local.parentRect = local.$parent.dndClientRect();

					var axis = api.getBorderedAxis(), crect = $el.dndClientRect(), srect = local.rect = $el.dndStyleRect();

					local.borders = api.getBorders();
					local.startAxis = axis;

					local.minScaleX = opts.minWidth / srect.width;
					local.minScaleY = opts.minHeight / srect.height;
					local.maxScaleX = opts.maxWidth / srect.width;
					local.maxScaleY = opts.maxHeight / srect.height;

					local.deltaX = crect.left - srect.left + crect.width / 2 - srect.width / 2;
					local.deltaY = crect.top - srect.top + crect.height / 2 - srect.height / 2;

					scope.$resized = true;

					dragstartCallback(scope);

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				function drag(api) {
					var local = api.local;

					if (!local.started) return;

					var axis = api.getBorderedAxis();
					var vector = Point(axis).minus(local.startAxis).transform(local.inverseRotateMatrix);

					var scale = {x:1,y:1};

					var width = local.rect.width,
						height = local.rect.height,
						top = local.rect.top,
						left = local.rect.left;

					switch(side) {
						case 'n': scale.y = (height - vector.y) / height; break;
						case 'e': scale.x = (width + vector.x) / width; break;
						case 's': scale.y = (height + vector.y) / height; break;
						case 'w': scale.x = (width - vector.x) / width; break;
						case 'ne': scale.x = (width + vector.x) / width; scale.y = (height - vector.y) / height; break;
						case 'se': scale.x = (width + vector.x) / width; scale.y = (height + vector.y) / height; break;
						case 'sw': scale.x = (width - vector.x) / width; scale.y = (height + vector.y) / height; break;
						case 'nw': scale.x = (width - vector.x) / width; scale.y = (height - vector.y) / height; break;
					}

					scale.x = getNumFromSegment(local.minScaleX, scale.x, local.maxScaleX);
					scale.y = getNumFromSegment(local.minScaleY, scale.y, local.maxScaleY);

					var offset;
					var center = getCenterPoint(local.rect);
					var scaledCenter = getCenterPoint(local.rect, scale);

					switch(side) {
						case 'n': offset = Point(left,top+height*scale.y).rotate(local.rads, scaledCenter).minus( Point(left,top+height).rotate(local.rads, center) ); break;
						case 'e': offset = Point(left,top).rotate(local.rads, scaledCenter).minus( Point(left,top).rotate(local.rads, center) ); break;
						case 's': offset = Point(left,top).rotate(local.rads, scaledCenter).minus( Point(left,top).rotate(local.rads, center) ); break;
						case 'w': offset = Point(left+width*scale.x,top).rotate(local.rads, scaledCenter).minus( Point(left+width,top).rotate(local.rads, center) ); break;
						case 'ne': offset = Point(left,top+height*scale.y).rotate(local.rads, scaledCenter).minus( Point(left,top+height).rotate(local.rads, center) ); break;
						case 'se': offset = Point(left,top).rotate(local.rads, scaledCenter).minus( Point(left,top).rotate(local.rads, center) ); break;
						case 'sw': offset = Point(left+width*scale.x,top).rotate(local.rads, scaledCenter).minus( Point(left+width,top).rotate(local.rads, center) ); break;
						case 'nw': offset = Point(left+width*scale.x,top+height*scale.y).rotate(local.rads, scaledCenter).minus( Point(left+width,top+height).rotate(local.rads, center) ); break;
					};

					var styles = {};
					styles.width = width * scale.x;
					styles.height = height * scale.y;
					styles.left = left - offset.x;
					styles.top = top - offset.y;

					var realCenter = Point(styles.left+local.deltaX+styles.width/2, styles.top+local.deltaY+styles.height/2);
					var boundedRect = Rect(styles.left+local.deltaX, styles.top+local.deltaY, styles.width, styles.height).applyMatrix( local.rotateMatrix, realCenter ).client();

					if (local.borders && (boundedRect.left+1 < local.borders.left || boundedRect.top+1 < local.borders.top || boundedRect.right-1 > local.borders.right || boundedRect.bottom-1 > local.borders.bottom)) {
						return;
					}

					if (rect) {
						rect.update(styles);
					} else {
						$el.dndCss(styles);
					}

					dragCallback(scope);

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				function dragend(api) {
					var local = api.local;

					if (!local.started) {
						return;
					}

					dragendCallback(scope);


					$timeout(function() { scope.$resized = false; });
				}

				return {
					'$$resizable.dragstart': dragstart,
					'$$resizable.drag': drag,
					'$$resizable.dragend': dragend
				};

			}

			var cssPosition = $el.dndCss('position');

			if (cssPosition !== 'fixed' && cssPosition !== 'absolute' && cssPosition !== 'relative') {
				cssPosition = 'relative';
				$el.dndCss('position', cssPosition);
			}

			var sides = opts.handles.replace(/\s/g,'').split(',');

			for(var i=0; i < sides.length; i++) {
				$el.append( createHandleElement( sides[i] ).dndBind( getBindings( sides[i] ) ) );
			}

			scope.$resized = false;
		}

		return {
			require: ['?dndRect', '?dndContainment'],
			scope: true,
			link: link
		};
	}]);
	;

	module.directive('dndSortableList', ['$parse', '$compile', function($parse, $compile) {
		function link(scope, element, attrs, ctrl) {
			var defaults = {
				layer: 'common'
			};
			var opts = ctrl.options = extend({}, defaults, $parse(attrs.dndSortableOpts)(scope) || {});
			var getter = ctrl.getter = $parse(attrs.dndSortableList) || angular.noop;
			var bindings = {};

			bindings[opts.layer+'.dragover'] = function(api) {
				if(getter(scope).length > 0) {
					return;
				}

				api.$sortable.model = {list: getter(scope)};
				api.$sortable.insertBefore = true;
				element.append(api.placeholder[0]);
			};

			element.dndBind(bindings);
		}

		controller.$inject = ['$scope', '$element', '$attrs'];
		function controller (scope, element, attrs) { }

		return {
			scope: true,
			link: link,
			controller: controller
		};
	}]);

	module.directive('dndSortable', ['$parse', '$compile', function($parse, $compile) {
		var placeholder, ngRepeatRegExp = /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/;
		var defaults = {
			layer: 'common'
		};



		function join(obj, sep1, sep2) {
			return Object.getOwnPropertyNames(obj).map(function(key) {
				return [key, obj[key]].join(sep1);
			}).join(sep2);
		}

		function joinObj (obj) {
			return '{' + join(obj, ':', ',') + '}';
		}

		function joinAttrs (attrs) {
			return join(attrs, '="', '" ') + '"';
		}

		function template(element, tAttrs) {
			var tag = element[0].nodeName.toLowerCase();
			var ngRepeat = tAttrs.ngRepeat || '';
			var match = ngRepeat.match(ngRepeatRegExp);

			if(!match) {
				throw 'dnd-sortable-item requires ng-repeat as dependence';
			}

			var lhs = match[1];
			var rhs = match[2];

			lhs = lhs.match(/^(?:(\s*[\$\w]+)|\(\s*([\$\w]+)\s*,\s*([\$\w]+)\s*\))$/);

			var model = {
				item: 'item: ' + (lhs[3] || lhs[1]) + ', ',
				list: 'list: ' + rhs.replace(/\s\|(.)+$/g,'') + ', ',
				index: 'index: ' + '$index'
			};

			var opts = angular.extend({
				layer: "'common'",
				handle: "''"
			}, $parse(tAttrs.dndSortableOpts)());

			var attrs = {
				'ng-transclude': '',
				'dnd-draggable': '',
				'dnd-draggable-opts': joinObj({
					helper: "'clone'",
					useAsPoint: true,
					layer: opts.layer,
					handle: opts.handle
				}),
				'dnd-droppable': '',
				'dnd-droppable-opts': joinObj({
					layer: opts.layer
				}),
				'dnd-on-dragstart': '$$onDragStart($api, $dropmodel, $dragmodel)',
				'dnd-on-dragend': '$$onDragEnd($api, $dropmodel, $dragmodel)',
				'dnd-on-dragover': '$$onDragOver($api, $dropmodel, $dragmodel)',
				'dnd-on-drag': '$$onDrag($api, $dropmodel, $dragmodel)',
				'dnd-model': '{' + model.item + model.list + model.index +'}'
			};

			return '<' + tag + ' ' + joinAttrs(attrs) + '></' + tag + '>';
		}

		function link(scope, element, attrs, ctrls) {
			var listCtrl = ctrls[0];
			var css = element.dndCss(['float', 'display']);
			var parentNode = element[0].parentNode;
			var floating = /left|right|inline/.test(css.float + css.display);
			var getter = $parse(attrs.dndModel) || noop;
			var sortstartCallback = $parse(attrs.dndOnSortstart);
			var sortCallback = $parse(attrs.dndOnSort);
			var sortchangeCallback = $parse(attrs.dndOnSortchange);
			var sortendCallback = $parse(attrs.dndOnSortend);
			var sortenterCallback = $parse(attrs.dndOnSortenter);
			var sortleaveCallback = $parse(attrs.dndOnSortleave);


			function isHalfway(dragTarget, axis, dropmodel) {
				var rect = element.dndClientRect();

				return (floating ? (axis.x - rect.left) / rect.width : (axis.y - rect.top) / rect.height) > 0.5;
			}

			function moveValue(fromIndex, fromList, toIndex, toList) {
				toList = toList || fromList;
				toList.splice(toIndex, 0, fromList.splice(fromIndex, 1)[0]);
			}

			scope.$$onDragStart = function(api) {
				sortstartCallback(scope);

				api.placeholder = element.clone();
				element.addClass('ng-hide');
				api.placeholder.addClass('angular-dnd-placeholder');
				parentNode.insertBefore(api.placeholder[0], element[0]);
				api.$sortable = {};
				api.clearCache();

				if (!scope.$root || !scope.$root.$$phase) {
					scope.$apply();
				}
			};

			scope.$$onDragOver = function(api, dropmodel, dragmodel) {
				var isDraggingNow = angular.isDefined(api.$sortable);
				if (!isDraggingNow) {
					return;
				}
				var halfway = isHalfway(api.getDragTarget(), api.getBorderedAxis());

				halfway ? parentNode.insertBefore(api.placeholder[0], element[0].nextSibling) : parentNode.insertBefore(api.placeholder[0], element[0]);

				var model = getter(scope);

				if (sortchangeCallback !== angular.noop && (!api.$sortable.model || api.$sortable.model.index !== model.index)) {
					sortchangeCallback(scope);

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				api.$sortable.model = model;
				api.$sortable.insertBefore = !halfway;

				api.clearCache();
			};

			scope.$$onDragEnd = function(api) {
				element.removeClass('ng-hide');
				api.placeholder.remove();

				if(!api.$sortable.model) {
					return;
				}

				var fromIndex = scope.$index,
					toIndex = api.$sortable.model.index,
					fromList = getter(scope).list,
					toList = api.$sortable.model.list;

				if(toList === fromList) {
					if(toIndex < fromIndex) {
						if(!api.$sortable.insertBefore) toIndex++;
					} else {
						if(api.$sortable.insertBefore) toIndex--;
					}
				} else if(!api.$sortable.insertBefore) toIndex++;

				moveValue(fromIndex, fromList, toIndex, toList);

				api.clearCache();

				sortendCallback(scope);

				if (!scope.$root || !scope.$root.$$phase) {
					scope.$apply();
				}
			};

			(sortCallback !== angular.noop) && (scope.$$onDrag = function(api) {
				sortCallback(scope);

				if (!scope.$root || !scope.$root.$$phase) {
					scope.$apply();
				}
			});
		}

		return {
			scope: true,
			transclude: true,
			template: template,
			replace: true,
			link: link,
			require: ['^dndSortableList']
		};
	}]);
//TODO:
//create - вызывается при создании списка

//activate - начат процесс сортировки (вызывается у всех связанных списков)
//start - начат процесс сортировки (вызывается только у списка инициатора)

//sort - вызывается при любом движении манипулятора при сортировке
//change - сортировка списка изменилась
//out - манипулятор с элементом вынесен за пределы списка (а также, если было событие over и небыло out то и  при окончании сортировки)
//over -  манипулятор с элементом внесен в пределы списка

//beforeStop - будет вызвано у списка инициатора
//update - будет вызвано если список изменился
//deactivate - вызывается у всех связанных списков
//stop - вызывается самым последним у списка инициатора

//receive - элемент дропнулся ИЗ другого списка
//remove - элмент дропнулся В другой список

//example: http://jsfiddle.net/UAcC7/1441/
	;

	module.directive('dndSelectable', ['$parse', function($parse){

		var defaults = {};

		Controller.$inject = ['$scope', '$attrs', '$element'];
		function Controller($scope, $attrs, $element) {
			var getterSelecting = $parse($attrs.dndModelSelecting), setterSelecting = getterSelecting.assign || noop;
			var getterSelected = $parse($attrs.dndModelSelected), setterSelected = getterSelected.assign || noop;
			var getterSelectable = $parse($attrs.dndSelectable), setterSelectable = getterSelectable.assign || noop;
			var onSelected = $parse($attrs.dndOnSelected);
			var onUnselected = $parse($attrs.dndOnUnselected);
			var onSelecting = $parse($attrs.dndOnSelecting);
			var onUnselecting = $parse($attrs.dndOnUnselecting);

			setterSelected($scope, false);
			setterSelecting($scope, false);

			this.getElement = function(){
				return $element;
			};

			this.isSelected = function(){
				return getterSelected($scope);
			};

			this.isSelecting = function(){
				return getterSelecting($scope);
			};

			this.isSelectable = function(){
				var selectable = getterSelectable($scope);
				return selectable === undefined || selectable;
			};

			this.toggleSelected = function(val){
				val = val === undefined ? !this.isSelected() : val;

				return val ? this.selected() : this.unselected();
			};

			this.selecting = function(){
				if (!this.isSelectable()) {
					return this;
				}

				setterSelecting($scope, true);
				onSelecting($scope);

				return this;
			};

			this.unselecting = function(){
				setterSelecting($scope, false);
				onUnselecting($scope);

				return this;
			};

			this.selected = function(){
				if (!this.isSelectable()) {
					return this;
				}

				setterSelected($scope, true);
				onSelected($scope);

				return this;
			};

			this.unselected = function(){
				setterSelected($scope, false);
				onUnselected($scope);

				return this;
			};

			this.hit = function(a){
				var b = this.rectCtrl.getClient();

				for(var key in b) {
					b[key] = parseFloat(b[key]);
				}

				b.bottom = b.bottom == undefined ? b.top + b.height : b.bottom;
				b.right = b.right == undefined ? b.left + b.width : b.right;
				a.bottom = a.bottom == undefined ? a.top + a.height : a.bottom;
				a.right = a.right == undefined ? a.left + a.width : a.right;

				return (
					a.top <= b.top && b.top <= a.bottom && ( a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right ) ||
					a.top <= b.bottom && b.bottom <= a.bottom && ( a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right ) ||
					a.left >= b.left && a.right <= b.right && ( b.top <= a.bottom && a.bottom <= b.bottom ||  b.bottom >= a.top && a.top >= b.top || a.top <= b.top && a.bottom >= b.bottom) ||
					a.top >= b.top && a.bottom <= b.bottom && ( b.left <= a.right && a.right <= b.right || b.right >= a.left && a.left >= b.left || a.left <= b.left && a.right >= b.right) ||
					a.top >= b.top && a.right <= b.right && a.bottom <= b.bottom && a.left >= b.left
				);
			};

		}

		function LikeRectCtrl($element){
			this.$element = $element;
		}

		LikeRectCtrl.prototype = {
			getClient: function(){
				return this.$element.dndClientRect();
			}
		};

		return {
			restrict: 'A',
			require: ['dndSelectable', '^dndLassoArea', '?dndRect'],
			controller: Controller,
			scope: true,
			link: function(scope, $el, attrs, ctrls) {
				scope.$dndSelectable = ctrls[0];

				var rectCtrl = ctrls[2];

				ctrls[0].rectCtrl = rectCtrl ? rectCtrl : new LikeRectCtrl($el);

				ctrls[1].add(ctrls[0]);

				function ondestroy() {
					ctrls[1].remove(ctrls[0]);

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				$el.on('$destroy', ondestroy);
			}
		};
	}]);
	;

	module.directive('dndRect', ['$parse', function($parse){
		var setStyles = ['top','left','width','height', 'transform'];
		var getStyles = ['top','left','width','height', TRANSFORM];

		setStyles.has = function(val){
			return this.indexOf(val) > -1;
		}

		Controller.$inject = ['$scope', '$attrs', '$element'];
		function Controller( $scope, $attrs, $element ){
			var getter = $parse($attrs.dndRect), setter = getter.assign || noop, lastRect;

			this.update = function(prop, value) {
				var values, rect = getter($scope) || {};

				if (typeof prop != 'object') {
					values = {};
					values[prop] = value;
				} else values = prop;

				for(var i = 0; i < setStyles.length; i++){
					var style = setStyles[i];

					if(values[style] !== undefined) rect[style] = values[style];
				}

				setter($scope, rect);
			};

			this.get = function(){
				return getter($scope);
			};

			this.getClient = function(){
				return $element.dndClientRect();
			};

			function sanitize(rect){
				var css;

				rect = typeof rect == 'object' ? rect : {};

				for(var i = 0; i < setStyles.length; i++){

					var style = setStyles[i];

					if(rect[style] !== undefined) continue;

					if(!css) css = $element.dndCss(getStyles);

					rect[style] = (style === 'transform') ? css[TRANSFORM] : css[style];
				}

				for(var key in rect){
					rect[key.toLowerCase()] = rect[key];
				}

				for(var key in rect) {
					if(setStyles.has(key)) {
						if(typeof rect[key] === 'number') rect[key] = rect[key]+'px';
					} else delete rect[key];
				}

				return rect;
			};

			$scope.$parent.$watch(function(){
				var rect = getter($scope.$parent);

				if(rect !== lastRect) setter($scope, rect);
			});

			$scope.$watch($attrs.dndRect, function(n, o){
				if(!n || typeof n != 'object') return;
				if(o == undefined) o = {};

				var lastRect = n = sanitize(n);

				var css = {};

				for(var val, i=0; i < setStyles.length; i++ ){
					val = setStyles[i];

					if(n[val] == undefined && o[val] != undefined) {
						css[val] = '';
					} else if(n[val] != undefined) {
						css[val] = n[val];
					}
				}

				if(css.transform) {
					css[TRANSFORM] = css.transform;
				}

				$element.dndCss(css);

			}, true);
		}

		return {
			restrict: 'A',
			controller: Controller
		};
	}])
	;

	module.directive('dndModel', ['$parse', function($parse){

		Controller.$inject = ['$scope', '$attrs'];
		function Controller( $scope, $attrs ){
			var getter = $parse($attrs.dndModel), setter = getter.assign

			this.set = function(value){
				setter($scope, value);
			};

			this.get = function(){
				return getter($scope);
			};
		}

		return {
			restrict: 'A',
			controller: Controller
		}
	}])
	;

	module.directive('dndLassoArea', ['DndLasso', '$parse', '$timeout', 'dndKey', function(DndLasso, $parse, $timeout, dndKey){

		Controller.$inject = [];
		function Controller(){
			var ctrls = [], data = {};

			this.data = function(){
				return data;
			};

			this.add = function(ctrl){
				ctrls.push(ctrl);
			};

			this.remove = function(ctrl){
				for(var i = 0; i < ctrls.length; i++){
					if(ctrls[i] === ctrl) {
						ctrls.splice(i,1);
						return true;
					}
				}

				return false;
			};

			this.getSelectable = function(element){
				for(var i = 0; i < ctrls.length; i++){
					if(ctrls[i].getElement()[0] == element) return ctrls[i];
				}

				return undefined;
			};

			this.empty = function(){
				return !ctrls.length;
			};

			this.get = function(i){
				return i === undefined ? ctrls : ctrls[i];
			}
		}

		var ctrls = [];

		ctrls.remove = function (ctrl){
			for(var i = 0; i < this.length; i++){
				if(this[i] === ctrl) {
					this.splice(i,1);
					return true;
				}
			}

			return false;
		}

		return {
			restrict: 'A',
			controller: Controller,
			require: 'dndLassoArea',
			/* отрицательный приоритет необходим для того, что бы post link function dnd-lasso-area запускался раньше post link function ng-click */
			priority: -1,
			link: function(scope, $el, attrs, ctrl){
				var defaults = {
					selectAdditionals: true
				};

				var getterLassoArea = $parse(attrs.dndLassoArea);
				var opts = extend({}, defaults, $parse(attrs.dndLassoAreaOpts)(scope) || {});
				var dragstartCallback = $parse(attrs.dndOnLassostart);
				var dragCallback = $parse(attrs.dndOnLasso);
				var dragendCallback = $parse(attrs.dndOnLassoend);
				var clickCallback = $parse(attrs.dndLassoOnclick);
				var lasso = new DndLasso({ $el:$el }), selectable, keyPressed;

				ctrls.push(ctrl);

				function onClick(event){
					if(!ctrl.empty()) {

						if(keyPressed) {
							selectable.toggleSelected();
							return
						}

						var s = ctrl.get();

						for(var i = 0; i < s.length; i++){
							s[i].unselected().unselecting();
						}

						if(selectable) selectable.selected();

					}

					clickCallback( scope, {$event: event});

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				function onStart(handler) {
					scope.$dragged = true;

					if(!handler.isActive()) return;

					dragstartCallback( scope );

					if(!ctrl.empty() && !keyPressed) {

						var s = ctrl.get();

						for(var i = 0; i < s.length; i++){
							s[i].unselected().unselecting();
						}

					}

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				function onDrag(handler) {
					scope.$dragged = true;

					if(!handler.isActive()) return;

					if(!ctrl.empty()) {
						var s = ctrl.get(), rect = handler.getClientRect();

						for(var i = 0; i < s.length; i++) {
							s[i].hit(rect) ? s[i].selecting() : s[i].unselecting();
						}
					}

					dragCallback(scope, { $rect: handler.getRect() });

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				}

				function onEnd(handler) {

					if(!handler.isActive()) return;

					var s = ctrl.get();

					if(!ctrl.empty()) {

						for(var i = 0; i < s.length; i++){
							if(s[i].isSelecting()) s[i].toggleSelected();
						}

						for(var i = 0; i < s.length; i++){
							s[i].unselecting();
						}
					}

					dragendCallback(scope, { $rect: handler.getRect() });

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}

					/* что бы события click/dblclick получили флаг $dragged === true, переключение флага происходит после их выполнения */
					$timeout(function(){ scope.$dragged = false; });
				}

				$el.on('mousedown touchstart', throttle(function (event){

					scope.$dragged = false;

					//scope.$keypressed = keyPressed = ( dndKey.isset(16) || dndKey.isset(17) || dndKey.isset(18) );
					scope.$keypressed = keyPressed = opts.selectAdditionals ? ( event.shiftKey || event.ctrlKey || event.metaKey ) : false;

					if(!ctrl.empty()) {
						selectable = ctrl.getSelectable(event.target);
					}

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}

				}, 300) );

				$el.on('click', function(event){

					if(!scope.$dragged) onClick(event);

					/* что бы события dnd-on-* получили флаг $keypressed, переключение флага происходит после их выполнения */
					if(scope.$keypressed) $timeout(function(){ scope.$keypressed = false; });
				} );

				lasso.on('start', onStart);
				lasso.on('drag', onDrag);
				lasso.on('end', onEnd);

				$el.on('$destroy', function(){
					ctrls.remove(ctrl);

					if (!scope.$root || !scope.$root.$$phase) {
						scope.$apply();
					}
				});

				scope.$dragged = false;
			}
		};
	}])
	;

	/**
	 * @name dnd.fittext
	 *
	 * @description
	 * Отличная функция для подгонки текста под размер блока, в котором этот текст находится.
	 * за единственный аргумент функция принимает объект rect, содержащий в себе ширину (width) и высоту (height) элемента.
	 * На основе этих параметров идет расчет высоты шрифта.
	 * Также у директвы есть дополнительные атрибуты-настройки: dnd-fittext-max и dnd-fittext-min,
	 * которые позволяют задать максимальное и минимальное соответственно значение шрифта.
	 *
	 */

	module.directive('dndFittext', ['$timeout', '$window', function( $timeout, $window ){
		var $span = $('<span></span>').dndCss({'position':'absolute','left':-99999, 'top':-99999, 'opacity':0, 'z-index': -9999});

		$(document.body).append( $span );

		function encodeStr(val) {
			var val = $span.text(val).html().replace(/\s+/g, ' ')
			if($span[0].tagName == 'INPUT' || $span[0].tagName == 'TEXTAREA') val = val.replace(/\s/g,'&nbsp;');

			return val;
		}

		function getRealSize(text, font) {
			$span.html( encodeStr(text) ).dndCss(font);
			var rect = $span[0].getBoundingClientRect();

			return {
				width: parseFloat(rect.width),
				height: parseFloat(rect.height)
			}
		}

		function getCurrSize($el, offsetWidthPrct, offsetHeightPrct){
			var rect = $el[0].getBoundingClientRect();

			return {
				width: parseFloat(rect.width)*(100-offsetWidthPrct)/100,
				height: parseFloat(rect.height)*(100-offsetHeightPrct)/100
			}
		}

		return {
			restrict: 'A',
			link: function(scope, $el, attrs) {

				function updateSize(opts) {
					opts = opts === undefined ? {} : opts;
					var font = $el.dndCss(
						['font-size','font-family','font-weight','text-transform','border-top','border-right','border-bottom','border-left','padding-top','padding-right','padding-bottom','padding-left']
					), text = opts.text == undefined ? $el.text() || $el.val() : opts.text;

					var sizes = [];
					if(opts.width === undefined) sizes.push('width');
					if(opts.height === undefined) sizes.push('height');

					if(sizes.length) sizes = $el.dndCss(sizes);

					for(var key in sizes){
						var val = sizes[key];

						if(val[val.length-1] == '%') return;
						opts[key] = sizes[key];
					}

					var realSize = getRealSize(text, font), currSize = getCurrSize($el,0,0);
					if(!realSize.width || !realSize.height) {
						$el.dndCss('font-size', '');
						return
					}

					currSize.width = parseFloat(opts.width);
					currSize.height = parseFloat(opts.height);

					var kof1 = currSize.height / realSize.height;
					var kof2 = currSize.width / realSize.width;

					var max = scope.$eval(attrs.dndFittextMax);
					var min = scope.$eval(attrs.dndFittextMin);

					if(min == undefined) min = 0;
					if(max == undefined) max = Number.POSITIVE_INFINITY;

					var kof = (kof1 < kof2 ? kof1 : kof2);

					//Корректировка плавности
					kof *= 0.85;
					if((kof > 0.95 && kof <= 1) || (kof >= 1 && kof < 1.05) ) return;

					var n = kof * parseFloat(font['font-size']);

					n = getNumFromSegment(min, n, max);

					$el.dndCss('font-size', n+'px');
				}

				scope.$watch( attrs.dndFittext, throttle(function(opts){
					updateSize(opts);
				}), true);

				$($window).on('resize', function(){
					updateSize();
				});
			}
		};
	}])
	;

	module.directive('dndKeyModel', ['$parse', 'dndKey', function($parse, dndKey){
		return {
			restrict: 'A',
			link: function(scope, $el, attrs) {
				var getter = $parse(attrs.dndKeyModel), setter = getter.assign;

				scope.$watch(function(){ return dndKey.get() }, function(n,o){
					if(n === undefined) return;
					setter(scope, n);
				});
			}
		}
	}])
	;

	module.directive('dndContainment', ['$parse', function($parse){

		Controller.$inject = ['$element', '$attrs', '$scope'];
		function Controller( $element, $attrs, $scope){
			var getterSelector = $parse($attrs.dndContainment);

			this.get = function () {
				var selector = getterSelector($scope);

				return selector ? $element.dndClosest(selector).eq(0) : $element.parent();
			}
		}

		return {
			restrict: 'EAC',
			controller: Controller,
		}
	}])
	;

	module.factory('dndKey', ['$rootScope', function ($rootScope) {
		var keys = [];

		function DndKey(){

		};

		DndKey.prototype = {
			get: function(){
				return keys;
			},
			isset: function(code){
				var index = keys.indexOf(code);
				return (index !== -1);
			}
		};

		function keydown(event){
			var code = event.keyCode;
			debounceKeyup(event);
			if(keys.indexOf(code) > -1) return;

			keys.push(code);
			$rootScope.$digest();
		}

		function keyup(event){
			var code = event.keyCode, index = keys.indexOf(code);
			if(index === -1) return;

			keys.splice(index,1);
			$rootScope.$digest();
		};



		var debounceKeyup = debounce(keyup, 1000);
		$document.on('keydown', keydown);
		$document.on('keyup', keyup);

		return new DndKey;
	}])
	;

	module.factory('DndLasso', [function () {
		var $div = $('<div></div>').dndCss({position: 'absolute'});

		var defaults = {
			className: 'angular-dnd-lasso',
			offsetX: 0,
			offsetY: 0
		};

		function Handler(local){

			this.getRect = function(){
				return this.isActive ? local.rect : undefined;
			}

			this.getClientRect = function(){
				return this.isActive ? $div.dndClientRect() : undefined;
			}

			this.isActive = function(){
				return local.active;
			}
		}

		function Local(api){
			var isTarget = api.isTarget(), handler = new Handler(this);

			this.isTarget = function(){
				return isTarget;
			}

			this.handler = function(){
				return handler;
			}

			this.getEvent = function(){
				return api.getEvent();
			}
		}

		function Lasso(opts){

			var self = this;

			opts = extend( {}, defaults, opts );

			function dragstart(api) {
				var local = api.local = new Local(api);

				if( !local.isTarget() ) {
					self.trigger('start', local.handler() );
					return;
				}

				local.active = true;

				self.trigger('start', local.handler() );

				api.setReferenceElement(opts.$el);
				api.setBounderElement(opts.$el);

				local.startAxis = api.getRelBorderedAxis();

				$div.removeAttr('class style').removeClass('ng-hide').addClass(opts.className);

				opts.$el.append( $div );

			};

			function drag(api) {
				var local = api.local;

				if( !local.active )  {
					self.trigger('drag', local.handler());
					return;
				}

				var change = api.getRelBorderedAxis().minus(local.startAxis);

				var rect = {
					top: local.startAxis.y,
					left: local.startAxis.x,
					width: change.x,
					height: change.y
				};

				if(rect.width < 0) {
					rect.width = - rect.width;
					rect.left = rect.left - rect.width;
				}

				if(rect.height < 0) {
					rect.height = - rect.height;
					rect.top = rect.top - rect.height;
				}

				local.rect = rect;

				rect.top += opts.offsetY;
				rect.left += opts.offsetX;

				$div.dndCss(rect);

				self.trigger('drag', local.handler() );
			};

			function dragend(api) {
				var local = api.local;

				if( !local.active ) {
					self.trigger('end', local.handler());
					return;
				}

				$div.addClass('ng-hide');

				$(document.body).append( $div );

				self.trigger('end', local.handler() );
			};

			var bindings = {
				'$$lasso.dragstart': dragstart,
				'$$lasso.drag': drag,
				'$$lasso.dragend': dragend
			};

			opts.$el.dndBind(bindings);

			this.destroy = function(){
				opts.$el.dndUnbind();
			};

			var events = {};

			this.on = function(name, fn) {
				events[name] = events[name] || [];
				events[name].push(fn);
			};

			this.trigger = function(name, args) {
				events[name] = events[name] || [];
				args = args || typeof args === 'string' ? [args] : [];
				events[name].forEach(function(fn) {
					fn.apply(this, args);
				});
			}
		}

		return Lasso;
	}])
	;

	module.factory('EventEmitter', [function () {

		function EventEmitter() {
			var events = {};

			this.on = function(name, fn) {
				events[name] = events[name] || [];
				events[name].push(fn);
			};

			this.off = function(name, fn) {
				if(!events[name]) return;

				for(var i = 0, length = events[name].length; i < length; i++){
					if(events[name][i] === fn) events[name].splice(i, 1);
				}
			};

			this.trigger = function(name, args) {
				events[name] = events[name] || [];
				args = args || typeof args === 'string' ? [args] : [];
				events[name].forEach(function(fn) {
					fn.apply(this, args);
				});
			}
		}

		return EventEmitter;
	}])


})(angular, undefined, window, document);