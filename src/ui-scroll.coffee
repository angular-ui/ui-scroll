###!
globals: angular, window

	List of used element methods available in JQuery but not in JQuery Lite

		element.before(elem)
		element.height()
		element.outerHeight(true)
		element.height(value) = only for Top/Bottom padding elements
		element.scrollTop()
		element.scrollTop(value)

###

angular.module('ui.scroll', [])

.directive( 'uiScrollViewport', ->
	controller: [
		'$scope', '$element'
		(scope, element) ->
			this.viewport = element
			this
	]
)

.directive( 'uiScroll', [
	'$log', '$injector', '$rootScope', '$timeout', '$q', '$parse'
	(console, $injector, $rootScope, $timeout, $q, $parse) ->

		log = console.debug || console.log

		# Element manipulation routines

		insertElement =
			(newElement, previousElement) ->
				previousElement.after newElement
				[]

		removeElement = (wrapper) ->
			wrapper.element.remove()
			wrapper.scope.$destroy()
			[]

		$animate = $injector.get('$animate') if $injector.has && $injector.has('$animate')
		isAngularVersionLessThen1_3 = angular.version.major == 1 and angular.version.minor < 3

		if not $animate
			insertElementAnimated = insertElement
			removeElementAnimated = removeElement
		else
			if isAngularVersionLessThen1_3
				insertElementAnimated = (newElement, previousElement) ->
					deferred = $q.defer()
					# no need for parent - previous element is never null
					$animate.enter newElement, null, previousElement, -> deferred.resolve()
					[deferred.promise]
				removeElementAnimated = (wrapper) ->
					deferred = $q.defer()
					$animate.leave wrapper.element, ->
						wrapper.scope.$destroy()
						deferred.resolve()
					[deferred.promise]
			else
				insertElementAnimated = (newElement, previousElement) ->
					# no need for parent - previous element is never null
					[$animate.enter newElement, null, previousElement]
				removeElementAnimated = (wrapper) ->
					[($animate.leave wrapper.element).then ->
						wrapper.scope.$destroy()
					]

		Buffer = (itemName, $scope, linker, bufferSize)->

			buffer = Object.create Array.prototype

			reset = (origin)->
				buffer.eof = false
				buffer.bof = false
				buffer.first = origin
				buffer.next = origin
				buffer.minIndex = Number.MAX_VALUE
				buffer.maxIndex = Number.MIN_VALUE

			buffer.size = bufferSize

			buffer.append = (items) ->
				for item in items
					++buffer.next
					buffer.insert 'append', item

			buffer.prepend = (items) ->
				for item in items.reverse()
					--buffer.first
					buffer.insert 'prepend', item

			# inserts wrapped element in the buffer
			# the first argument is either operation keyword (see below) or a number for operation 'insert'
			# for insert the number is the index for the buffer element the new one have to be inserted after
			# operations: 'append', 'prepend', 'insert', 'remove', 'update', 'none'
			buffer.insert = (operation, item) ->
				itemScope = $scope.$new()
				itemScope[itemName] = item
				wrapper =
					scope: itemScope
					item: item

				linker itemScope, (clone) ->
					wrapper.element = clone

				if operation % 1 == 0 # it is an insert
					wrapper.op = 'insert'
					buffer.splice operation, 0, wrapper
				else
					wrapper.op = operation
					switch operation
						when 'append' then buffer.push wrapper
						when 'prepend' then buffer.unshift wrapper

			# removes elements from buffer
			buffer.remove = (arg1, arg2) ->
				if angular.isNumber arg1
					#removes items from arg1 (including) through arg2 (excluding)
					for i in [arg1...arg2]
						removeElement buffer[i]
					buffer.splice arg1, arg2 - arg1
				else
					# removes single item(wrapper) from the buffer
					buffer.splice buffer.indexOf(arg1), 1
					removeElementAnimated arg1

			buffer.setUpper = ->
					buffer.maxIndex = if buffer.eof then buffer.next - 1 else Math.max buffer.next - 1, buffer.maxIndex

			buffer.setLower = ->
				buffer.minIndex = if buffer.bof then buffer.minIndex = buffer.first else Math.min buffer.first, buffer.minIndex

			buffer.syncDatasource = (datasource)->
				offset = buffer.minIndex - (Math.min buffer.minIndex, datasource.minIndex || Number.MAX_VALUE)
				datasource.minIndex = (buffer.minIndex -= offset)
				datasource.maxIndex = buffer.maxIndex = Math.max buffer.maxIndex, datasource.maxIndex || Number.MIN_VALUE
				offset

			# clears the buffer
			buffer.clear = ->
				buffer.remove(0, buffer.length)
				if arguments.length
					reset arguments[0]
				else
					reset(1)

			reset(1)

			buffer

		Padding = (template) ->
			tagName = template.localName
			if tagName in ['dl']
				throw new Error 'ui-scroll directive does not support <' + tagName + '> as a repeating tag: ' + template.outerHTML
			tagName = 'div' if tagName not in ['li', 'tr']

			switch tagName
				when 'tr'
					table = angular.element('<table><tr><td><div></div></td></tr></table>')
					div = table.find('div')
					result = table.find('tr')
				else
					result = angular.element('<' + tagName + '></' + tagName + '>')
			result


		Viewport = (buffer, element, controllers, attrs) ->

			viewport = if controllers[0] and controllers[0].viewport then controllers[0].viewport else angular.element(window)
			viewport.css({'overflow-y': 'auto', 'display': 'block'})

			topPadding = null
			bottomPadding = null
			averageItemHeight = 0

			bufferPadding = -> viewport.outerHeight() * Math.max(0.1, +attrs.padding || 0.1) # some extra space to initiate preload

			viewport.createPaddingElements = (template) ->
				topPadding = new Padding template
				bottomPadding = new Padding template
				element.before topPadding
				element.after bottomPadding

			viewport.bottomDataPos = ->
				(viewport[0].scrollHeight ? viewport[0].document.documentElement.scrollHeight) - bottomPadding.height()

			viewport.topDataPos = -> topPadding.height()

			viewport.bottomVisiblePos = -> viewport.scrollTop() + viewport.outerHeight()

			viewport.topVisiblePos = -> viewport.scrollTop()

			viewport.insertElement = (e, sibling) -> insertElement(e, sibling || topPadding)

			viewport.insertElementAnimated = (e, sibling) -> insertElementAnimated(e, sibling || topPadding)

			viewport.shouldLoadBottom = ->
				!buffer.eof && viewport.bottomDataPos() < viewport.bottomVisiblePos() + bufferPadding()

			viewportOffset = if viewport.offset() then -> viewport.offset() else -> {top:0}

			viewport.clipBottom = ->
				# clip the invisible items off the bottom
				overage = 0
				for i in [buffer.length-1..0]
					item = buffer[i]
					if item.element.offset().top - viewportOffset().top > viewport.outerHeight() + bufferPadding()
						overage++
					else break
				if overage > 0
					buffer.eof = false
					buffer.remove(buffer.length - overage, buffer.length)
					buffer.next -= overage
					viewport.adjustPadding()

			viewport.shouldLoadTop = ->
				!buffer.bof && (viewport.topDataPos() > viewport.topVisiblePos() - bufferPadding())

			viewport.clipTop = ->
				# clip the invisible items off the top
				overage = 0
				overageHeight = 0
				for item in buffer
					if item.element.offset().top - viewportOffset().top + item.element.outerHeight(true) < (-1) * bufferPadding()
						overageHeight += item.element.outerHeight(true)
						overage++
					else break
				if overage > 0
					# we need to adjust top padding element before items are removed from top
					# to avoid strange behaviour of scroll bar during remove top items when we are at the very bottom
					topPadding.height topPadding.height() + overageHeight
					buffer.bof = false
					buffer.remove(0, overage)
					buffer.first += overage

			viewport.adjustPadding = () ->
				return if not buffer.length
				averageItemHeight = (buffer[buffer.length - 1].element.offset().top +
					buffer[buffer.length - 1].element.outerHeight(true) -
					buffer[0].element.offset().top) / buffer.length
				topPadding.height (buffer.first - buffer.minIndex) * averageItemHeight
				bottomPadding.height (buffer.maxIndex - buffer.next + 1) * averageItemHeight

			viewport.syncDatasource = (datasource) ->
				return if not buffer.length
				delta = buffer.syncDatasource(datasource) * averageItemHeight
				topPadding.height topPadding.height() + delta
				viewport.scrollTop viewport.scrollTop() + delta
				viewport.adjustPadding()

			viewport.adjustScrollTop = (height) ->
				paddingHeight = topPadding.height() - height
				if paddingHeight >= 0
					topPadding.height paddingHeight
				else
					topPadding.height 0
					viewport.scrollTop viewport.scrollTop() - paddingHeight

			viewport


		Adapter = ($attr, viewport, buffer, adjustBuffer) ->

			this.isLoading = false

			viewportScope = viewport.scope() || $rootScope

			applyUpdate = (wrapper, newItems) ->
				if angular.isArray newItems
					pos = (buffer.indexOf wrapper) + 1
					for newItem,i in newItems.reverse()
						if newItem == wrapper.item
							keepIt = true;
							pos--
						else
							buffer.insert pos, newItem
					unless keepIt
						wrapper.op = 'remove'

			this.applyUpdates = (arg1, arg2) ->
				if angular.isFunction arg1
					# arg1 is the updater function, arg2 is ignored
					bufferClone = buffer.slice(0)
					for wrapper,i in bufferClone  # we need to do it on the buffer clone, because buffer content
						# may change as we iterate through
						applyUpdate wrapper, arg1(wrapper.item, wrapper.scope, wrapper.element)
				else
					# arg1 is item index, arg2 is the newItems array
					if arg1%1 == 0 # checking if it is an integer
						if 0 <= arg1-buffer.first < buffer.length
							applyUpdate buffer[arg1 - buffer.first], arg2
					else
						throw new Error 'applyUpdates - ' + arg1 + ' is not a valid index'
				adjustBuffer()

			this.append = (newItems) ->
				buffer.append newItems
				adjustBuffer()

			this.prepend = (newItems) ->
				buffer.prepend newItems
				adjustBuffer()

			setTopVisible = if $attr.topVisible then $parse($attr.topVisible).assign else ->
			setTopVisibleElement = if $attr.topVisibleElement then $parse($attr.topVisibleElement).assign else ->
			setTopVisibleScope = if $attr.topVisibleScope then $parse($attr.topVisibleScope).assign else ->
			setIsLoading = if $attr.isLoading then $parse($attr.isLoading).assign else ->

			this.loading = (value) ->
				this.isLoading = value
				setIsLoading viewportScope, value

			this.calculateProperties = ->
				topHeight = 0
				for item in buffer
					itemTop = item.element.offset().top
					newRow = rowTop isnt itemTop
					rowTop = itemTop
					itemHeight = item.element.outerHeight(true) if newRow
					if newRow and (viewport.topDataPos() + topHeight + itemHeight <= viewport.topVisiblePos())
						topHeight += itemHeight
					else
						if newRow
							this.topVisible = item.item
							this.topVisibleElement = item.element
							this.topVisibleScope = item.scope
							setTopVisible(viewportScope, item.item)
							setTopVisibleElement(viewportScope, item.element)
							setTopVisibleScope(viewportScope, item.scope)
						break


			return

		require: ['?^uiScrollViewport']
		transclude: 'element'
		priority: 1000
		terminal: true

		compile: (elementTemplate, attr, compileLinker) ->

			unless match = attr.uiScroll.match(/^\s*(\w+)\s+in\s+([\w\.]+)\s*$/)
				throw new Error 'Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + attr.uiScroll + '\''
			itemName = match[1]
			datasourceName = match[2]

			bufferSize = Math.max(3, +attr.bufferSize || 10)

			($scope, element, $attr, controllers, linker) ->

				#starting from angular 1.2 compileLinker usage is deprecated
				linker = linker || compileLinker

				datasource = $parse(datasourceName)($scope)
				isDatasourceValid = () -> angular.isObject(datasource) and angular.isFunction(datasource.get)
				if !isDatasourceValid() # then try to inject datasource as service
					datasource = $injector.get(datasourceName)
					if !isDatasourceValid()
						throw new Error datasourceName + ' is not a valid datasource'

				ridActual = 0 # current data revision id

				pending = []

				buffer = new Buffer(itemName, $scope, linker, bufferSize)

				viewport = new Viewport(buffer, element, controllers, $attr)

				adapter = new Adapter $attr, viewport, buffer,
					->
						dismissPendingRequests()
						adjustBuffer ridActual

				if $attr.adapter # so we have an adapter on $scope
					adapterOnScope = $parse($attr.adapter)($scope)
					if not angular.isObject adapterOnScope
						$parse($attr.adapter).assign($scope, {})
						adapterOnScope = $parse($attr.adapter)($scope)
					angular.extend(adapterOnScope, adapter)
					adapter = adapterOnScope

				# Build padding elements
				#
				# Calling linker is the only way I found to get access to the tag name of the template
				# to prevent the directive scope from pollution a new scope is created and destroyed
				# right after the builder creation is completed
				linker $scope.$new(), (template, scope) ->
					viewport.createPaddingElements(template[0])
					# Destroy template's scope to remove any watchers on it.
					scope.$destroy()
					# also remove the template when the directive scope is destroyed
					$scope.$on '$destroy', -> template.remove()

				dismissPendingRequests = () ->
					ridActual++
					pending = []

				reload = ->
					dismissPendingRequests()
					if arguments.length
						buffer.clear arguments[0]
					else
						buffer.clear()
					adjustBuffer ridActual

				adapter.reload = reload

				enqueueFetch = (rid, direction)->
					if !adapter.isLoading
						adapter.loading(true)
					if pending.push(direction) == 1
						fetch(rid)

				isElementVisible = (wrapper) -> wrapper.element.height() && wrapper.element[0].offsetParent

				visibilityWatcher = (wrapper) ->
					if isElementVisible(wrapper)
						for item in buffer
							if angular.isFunction item.unregisterVisibilityWatcher
								item.unregisterVisibilityWatcher()
								delete item.unregisterVisibilityWatcher
						adjustBuffer()

				insertWrapperContent = (wrapper, sibling) ->
					viewport.insertElement wrapper.element, sibling
					return true if isElementVisible(wrapper)
					wrapper.unregisterVisibilityWatcher = wrapper.scope.$watch () -> visibilityWatcher(wrapper)
					false

				processBufferedItems = (rid) ->
					promises = []
					toBePrepended = []
					toBeRemoved = []

					getPreSibling = (i) -> if i > 0 then buffer[i-1].element else undefined

					for wrapper, i in buffer
						switch wrapper.op
							when 'prepend' then toBePrepended.unshift wrapper
							when 'append'
								keepFetching = insertWrapperContent(wrapper, getPreSibling(i)) || keepFetching
								wrapper.op = 'none'
							when 'insert'
								promises = promises.concat (viewport.insertElementAnimated wrapper.element, getPreSibling(i))
								wrapper.op = 'none'
							when 'remove' then toBeRemoved.push wrapper

					for wrapper in toBeRemoved
						promises = promises.concat (buffer.remove wrapper)

					if toBePrepended.length
						adjustedPaddingHeight = 0
						for wrapper in toBePrepended
							keepFetching = insertWrapperContent(wrapper) || keepFetching
							wrapper.op = 'none'
							adjustedPaddingHeight += wrapper.element.outerHeight(true)
						viewport.adjustScrollTop(adjustedPaddingHeight)

					# re-index the buffer
					item.scope.$index = buffer.first + i for item,i in buffer

					# schedule another adjustBuffer after animation completion
					if (promises.length)
						$q.all(promises).then ->
							viewport.adjustPadding()
							#log "Animation completed rid #{rid}"
							adjustBuffer rid
					else
						viewport.adjustPadding()
						if not pending.length
							viewport.syncDatasource datasource

					keepFetching

				adjustBuffer = (rid) ->
					# We need the item bindings to be processed before we can do adjustment
					$timeout ->
						processBufferedItems(rid)
						if viewport.shouldLoadBottom()
							enqueueFetch(rid, true)
						else
							if viewport.shouldLoadTop()
								enqueueFetch(rid, false)
						adapter.calculateProperties() if not pending.length

				adjustBufferAfterFetch = (rid) ->
					# We need the item bindings to be processed before we can do adjustment
					$timeout ->
						keepFetching = processBufferedItems(rid)
						if viewport.shouldLoadBottom()
							# keepFetching = true means that at least one item app/prepended in the last batch had height > 0
							enqueueFetch(rid, true) if keepFetching
						else
							if viewport.shouldLoadTop()
								# pending[0] = true means that previous fetch was appending. We need to force at least one prepend
								# BTW there will always be at least 1 element in the pending array because bottom is fetched first
								enqueueFetch(rid, false) if keepFetching || pending[0]
						pending.shift()
						if not pending.length
							adapter.loading(false)
							adapter.calculateProperties()
						else
							fetch(rid)

				if datasource.get.length == 2
					fetchNext = (success) -> datasource.get
						index: buffer.next
						append: if buffer.length then buffer[buffer.length-1].item else undefined
						count: bufferSize
						success
					fetchPrevious = (success) -> datasource.get
						index: buffer.first-bufferSize
						prepend: if buffer.length then buffer[0].item else undefined
						count: bufferSize
						success
				else
					fetchNext = (success) -> datasource.get buffer.next, bufferSize, success
					fetchPrevious = (success) -> datasource.get buffer.first-bufferSize, bufferSize, success

				fetch = (rid) ->
					if pending[0] # scrolling down
						if buffer.length && !viewport.shouldLoadBottom()
							adjustBufferAfterFetch rid
						else
							fetchNext (result) ->
								return if (rid and rid isnt ridActual) or $scope.$$destroyed
								if result.length < bufferSize
									buffer.eof = true
									#log 'eof is reached'
								if result.length > 0
									viewport.clipTop()
									buffer.append result
								buffer.setUpper()
								adjustBufferAfterFetch rid
					else
						if buffer.length && !viewport.shouldLoadTop()
							adjustBufferAfterFetch rid
						else
							fetchPrevious (result) ->
								return if (rid and rid isnt ridActual) or $scope.$$destroyed
								if result.length < bufferSize
									buffer.bof = true
									#log 'bof is reached'
								if result.length > 0
									viewport.clipBottom() if buffer.length
									buffer.prepend result
								buffer.setLower()
								adjustBufferAfterFetch rid

				# events and bindings

				resizeAndScrollHandler = ->
					if !$rootScope.$$phase && !adapter.isLoading
						adjustBuffer()
						$scope.$apply()

				wheelHandler = (event) ->
					scrollTop = viewport[0].scrollTop
					yMax = viewport[0].scrollHeight - viewport[0].clientHeight
					if (scrollTop is 0 and not buffer.bof) or (scrollTop is yMax and not buffer.eof)
						event.preventDefault()

				viewport.bind 'resize', resizeAndScrollHandler
				viewport.bind 'scroll', resizeAndScrollHandler
				viewport.bind 'mousewheel', wheelHandler

				$scope.$watch datasource.revision, -> reload()

				$scope.$on '$destroy', ->
					# clear the buffer. It is necessary to remove the elements and $destroy the scopes
					buffer.clear()
					viewport.unbind 'resize', resizeAndScrollHandler
					viewport.unbind 'scroll', resizeAndScrollHandler
					viewport.unbind 'mousewheel', wheelHandler

				# update events (deprecated since v1.1.0, unsupported since 1.2.0)

				unsupportedMethod = (token) ->
					throw new Error token + ' event is no longer supported - use applyUpdates instead'
				eventListener = if datasource.scope then datasource.scope.$new() else $scope.$new()
				eventListener.$on 'insert.item', -> unsupportedMethod('insert')
				eventListener.$on 'update.items', -> unsupportedMethod('update')
				eventListener.$on 'delete.items', -> unsupportedMethod('delete')

])

###
//# sourceURL=src/ui-scroll.js
###
