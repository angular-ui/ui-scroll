angular.module('ui.scroll.jqlite', ['ui.scroll'])

.service('jqLiteExtras', [
	'$log', '$window'
	(console, window) ->
		registerFor : (element) ->

			# angular implementation blows up if elem is the window
			css = angular.element.prototype.css
			element.prototype.css = (name, value) ->
				self = this
				elem = self[0]
				css.call(self, name, value) unless !elem || elem.nodeType == 3 || elem.nodeType == 8 || !elem.style

			# as defined in angularjs v1.0.5
			isWindow = (obj) ->
				obj && obj.document && obj.location && obj.alert && obj.setInterval

			scrollTo = (self, direction, value) ->
				elem = self[0]
				[method, prop, preserve] = {
				top:  ['scrollTop', 'pageYOffset', 'scrollLeft']
				left: ['scrollLeft', 'pageXOffset', 'scrollTop']
				}[direction]
				if isWindow elem
					if angular.isDefined value
						elem.scrollTo self[preserve].call(self), value
					else
						if (prop of elem)
							elem[ prop ]
						else
							elem.document.documentElement[ method ]
				else
					if angular.isDefined value
						elem[method] = value
					else
						elem[method]


			if window.getComputedStyle
				getStyle = (elem) -> window.getComputedStyle(elem, null)
				convertToPx = (elem, value) -> parseFloat value
			else
				getStyle = (elem) -> elem.currentStyle
				convertToPx = (elem, value) ->
					core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source
					rnumnonpx = new RegExp( '^(' + core_pnum + ')(?!px)[a-z%]+$', 'i' )
					if !rnumnonpx.test(value)
						parseFloat value
					else
						# ported from JQuery
						style = elem.style
						left = style.left
						rs = elem.runtimeStyle
						rsLeft = rs && rs.left
						# put in the new values to get a computed style out
						rs.left = style.left if rs
						style.left = value
						result = style.pixelLeft
						style.left = left
						rs.left = rsLeft if rsLeft
						result


			getMeasurements = (elem, measure) ->
				if isWindow elem
					base = document.documentElement[{height: 'clientHeight', width: 'clientWidth'}[measure]]
					return {
						base: base
						padding: 0
						border: 0
						margin: 0
					}

				# Start with offset property
				[base, dirA, dirB] = {
				width:  [elem.offsetWidth, 'Left', 'Right']
				height: [elem.offsetHeight, 'Top', 'Bottom']
				}[measure]

				computedStyle = getStyle( elem )
				paddingA = convertToPx(elem, computedStyle[ 'padding' + dirA ] ) || 0
				paddingB = convertToPx(elem, computedStyle[ 'padding' + dirB ] ) || 0
				borderA = convertToPx(elem, computedStyle[ 'border' + dirA + 'Width' ] ) || 0
				borderB = convertToPx(elem, computedStyle[ 'border' + dirB + 'Width' ] ) || 0
				computedMarginA = computedStyle[ 'margin' + dirA ]
				computedMarginB = computedStyle[ 'margin' + dirB ]

				# I do not care for width for now, so this hack is irrelevant
				#if ( !supportsPercentMargin )
					#computedMarginA = hackPercentMargin( elem, computedStyle, computedMarginA )
					#computedMarginB = hackPercentMargin( elem, computedStyle, computedMarginB )

				marginA = convertToPx(elem, computedMarginA ) || 0
				marginB = convertToPx(elem, computedMarginB ) || 0

				base: base
				padding: paddingA + paddingB
				border: borderA + borderB
				margin: marginA + marginB


			getWidthHeight = ( elem, direction, measure ) ->
				measurements = getMeasurements(elem, direction)
				if measurements.base > 0
					{
						base: measurements.base - measurements.padding - measurements.border
						outer: measurements.base
						outerfull: measurements.base + measurements.margin
					}[measure]
				else

					#// Fall back to computed then uncomputed css if necessary
					computedStyle = getStyle( elem )
					result = computedStyle[ direction ]
					if ( result < 0 || result == null )
						result = elem.style[ direction ] || 0

					#// Normalize "", auto, and prepare for extra
					result = parseFloat( result ) || 0

					{
						base: result - measurements.padding - measurements.border
						outer: result
						outerfull: result + measurements.padding + measurements.border + measurements.margin
					}[measure]

			# define missing methods
			angular.forEach {

			before: (newElem) ->
				self = this
				elem = self[0]
				parent = self.parent()
				children = parent.contents()
				if children[0] == elem
					parent.prepend newElem
				else
					for i in [1..children.length-1]
						if children[i] == elem
							angular.element(children[i-1]).after newElem
							return
					throw new Error 'invalid DOM structure ' + elem.outerHTML

			height: (value) ->
				self = this
				if angular.isDefined value
					if angular.isNumber value
						value = value + 'px'
					css.call(self, 'height', value)

				else
					getWidthHeight(this[0], 'height', 'base')

			outerHeight: (option) ->
				getWidthHeight(this[0], 'height', if option then 'outerfull' else 'outer')

			###
The offset setter method is not implemented
			###

			offset: (value)->
				self = this
				if arguments.length
					return if value == undefined
						self
					else
						# TODO: implement setter
						throw new Error 'offset setter method is not implemented'

				box = {top:0, left:0}
				elem = self[0]
				doc = elem && elem.ownerDocument
				if !doc
					return

				docElem = doc.documentElement

				# TODO: Make sure it's not a disconnected DOM node

				box = elem.getBoundingClientRect() if elem.getBoundingClientRect?
				win = doc.defaultView || doc.parentWindow
				top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
				left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )

			scrollTop: (value) ->
				scrollTo this, 'top', value

			scrollLeft: (value) ->
				scrollTo this, 'left', value

			}, (value, key) ->
				element.prototype[key] = value unless element.prototype[key]

])

.run [
	'$log', '$window', 'jqLiteExtras'
	(console, window, jqLiteExtras) ->
		jqLiteExtras.registerFor angular.element unless window.jQuery
]

###
//# sourceURL=src/ui-scroll-jqlite.js
###