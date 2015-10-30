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

		Buffer = (itemName, $scope, linker)->

			buffer = Object.create Array.prototype

			# inserts wrapped element in the buffer
			# the first argument is either operation keyword (see below) or a number for operation 'insert'
			# for insert the number is the index for the buffer element the new one have to be inserted after
			# operations: 'append', 'prepend', 'insert', 'remove', 'update', 'none'
			buffer.insert = (operation, item) ->
				itemScope = $scope.$new()
				itemScope[itemName] = item
				wrapper =
					scope: itemScope

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

			#clears the buffer
			buffer.clear = ->
				buffer.remove(0, buffer.length)

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



		Viewport = (element, controllers) ->

			viewport = if controllers[0] and controllers[0].viewport then controllers[0].viewport else angular.element(window)
			viewport.css({'overflow-y': 'auto', 'display': 'block'})

			topPadding = null

			bottomPadding = null

			viewport.createPaddingElements = (template) ->

				topPadding = new Padding template
				element.before topPadding
				viewport.topPadding = -> topPadding.height.apply(topPadding, arguments)

				bottomPadding = new Padding template
				element.after bottomPadding
				viewport.bottomPadding = -> bottomPadding.height.apply(bottomPadding, arguments)

			viewport.bottomDataPos = ->
				(viewport[0].scrollHeight ? viewport[0].document.documentElement.scrollHeight) - bottomPadding.height()

			viewport.topDataPos = -> topPadding.height()

			viewport.bottomVisiblePos = ->
				viewport.scrollTop() + viewport.outerHeight()

			viewport.topVisiblePos = ->
				viewport.scrollTop()

			viewport.insertElement = (e, sibling) -> insertElement(e, sibling || topPadding)

			viewport.insertElementAnimated = (e, sibling) -> insertElementAnimated(e, sibling || topPadding)

			viewport


		require: ['?^uiScrollViewport']
		transclude: 'element'
		priority: 1000
		terminal: true

		compile: (elementTemplate, attr, compileLinker) ->

			unless match = attr.uiScroll.match(/^\s*(\w+)\s+in\s+([\w\.]+)\s*$/)
				throw new Error 'Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + attr.uiScroll + '\''
			itemName = match[1]
			datasourceName = match[2]



			($scope, element, $attr, controllers, linker) ->

				#starting from angular 1.2 compileLinker usage is deprecated
				linker = linker || compileLinker

				datasource = $parse(datasourceName)($scope)
				isDatasourceValid = () -> angular.isObject(datasource) and angular.isFunction(datasource.get)
				if !isDatasourceValid() # then try to inject datasource as service
					datasource = $injector.get(datasourceName)
					if !isDatasourceValid()
						throw new Error datasourceName + ' is not a valid datasource'

				bufferSize = Math.max(3, +$attr.bufferSize || 10)
				bufferPadding = -> viewport.outerHeight() * Math.max(0.1, +$attr.padding || 0.1) # some extra space to initiate preload

				# initial settings

				builder = null
				ridActual = 0 # current data revision id
				first = 1
				next = 1
				buffer = new Buffer(itemName, $scope, linker)
				pending = []
				eof = false
				bof = false

				viewport = new Viewport element, controllers

				# Padding element builder
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

				viewportScope = viewport.scope() || $rootScope

				#v = new Viewport element, controllers

				topVisible = (item) ->
					adapter.topVisible = item.scope[itemName]
					adapter.topVisibleElement = item.element
					adapter.topVisibleScope = item.scope
					$parse($attr.topVisible).assign(viewportScope, adapter.topVisible) if $attr.topVisible
					$parse($attr.topVisibleElement).assign(viewportScope, adapter.topVisibleElement) if $attr.topVisibleElement
					$parse($attr.topVisibleScope).assign(viewportScope, adapter.topVisibleScope) if $attr.topVisibleScope
					datasource.topVisible(item) if angular.isFunction(datasource.topVisible)

				loading = (value) ->
					adapter.isLoading = value
					$parse($attr.isLoading).assign($scope, value) if $attr.isLoading
					datasource.loading(value) if angular.isFunction(datasource.loading)

				dismissPendingRequests = () ->
					ridActual++
					pending = []

				reloadImpl = ->
					dismissPendingRequests()
					first = 1
					next = 1
					buffer.clear()
					viewport.topPadding(0)
					viewport.bottomPadding(0)
					eof = false
					bof = false
					adjustBuffer ridActual

				shouldLoadBottom = ->
					!eof && viewport.bottomDataPos() < viewport.bottomVisiblePos() + bufferPadding()

				clipBottom = ->
					# clip the invisible items off the bottom
					bottomHeight = 0
					overage = 0

					for i in [buffer.length-1..0]
						item = buffer[i]
						itemTop = item.element.offset().top
						newRow = rowTop isnt itemTop
						rowTop = itemTop
						itemHeight = item.element.outerHeight(true) if newRow
						if (viewport.bottomDataPos() - bottomHeight - itemHeight > viewport.bottomVisiblePos() + bufferPadding())
							bottomHeight += itemHeight if newRow
							overage++
							eof = false
						else
							break if newRow
							overage++

					if overage > 0
						viewport.bottomPadding(viewport.bottomPadding() + bottomHeight)
						buffer.remove(buffer.length - overage, buffer.length)
						next -= overage
						#log 'clipped off bottom ' + overage + ' bottom padding ' + viewport.bottomPadding()

				shouldLoadTop = ->
					!bof && (viewport.topDataPos() > viewport.topVisiblePos() - bufferPadding())

				clipTop = ->
					# clip the invisible items off the top
					topHeight = 0
					overage = 0
					for item in buffer
						itemTop = item.element.offset().top
						newRow = rowTop isnt itemTop
						rowTop = itemTop
						itemHeight = item.element.outerHeight(true) if newRow
						if (viewport.topDataPos() + topHeight + itemHeight < viewport.topVisiblePos() - bufferPadding())
							topHeight += itemHeight if newRow
							overage++
							bof = false
						else
							break if newRow
							overage++
					if overage > 0
						viewport.topPadding(viewport.topPadding() + topHeight)
						buffer.remove(0, overage)
						first += overage

				enqueueFetch = (rid, direction)->
					if !adapter.isLoading
						loading(true)
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

					bottomPos = viewport.bottomDataPos()
					for wrapper, i in buffer
						switch wrapper.op
							when 'prepend' then toBePrepended.unshift wrapper
							when 'append'
								if (i == 0) # the first item in buffer is to be appended, therefore the buffer was empty
									keepFetching = insertWrapperContent(wrapper) || keepFetching
								else
									keepFetching = insertWrapperContent(wrapper, buffer[i-1].element) || keepFetching
								wrapper.op = 'none'
							when 'insert'
								if (i == 0)
									promises = promises.concat (viewport.insertElementAnimated wrapper.element)
								else
									promises = promises.concat (viewport.insertElementAnimated wrapper.element, buffer[i-1].element)
								wrapper.op = 'none'
							when 'remove' then toBeRemoved.push wrapper

					for wrapper in toBeRemoved
						promises = promises.concat (buffer.remove wrapper)

					# for anything other than prepend adjust the bottomPadding height
					viewport.bottomPadding(Math.max(0,viewport.bottomPadding() - (viewport.bottomDataPos() - bottomPos)))

					if toBePrepended.length
						bottomPos = viewport.bottomDataPos()
						for wrapper in toBePrepended
							keepFetching = insertWrapperContent(wrapper) || keepFetching
							wrapper.op = 'none'

						heightIncrement = viewport.bottomDataPos() - bottomPos

						# adjust padding to prevent it from visually pushing everything down
						if viewport.topPadding() >= heightIncrement
							# if possible, reduce topPadding
							viewport.topPadding(viewport.topPadding() - heightIncrement)
						else
							# if not, increment scrollTop
							viewport.scrollTop(viewport.scrollTop() + heightIncrement)

					# re-index the buffer
					item.scope.$index = first + i for item,i in buffer

					# schedule another adjustBuffer after animation completion
					if (promises.length)
						$q.all(promises).then ->
							#log "Animation completed rid #{rid}"
							adjustBuffer rid

					keepFetching

				calculateTopProperties = ->
					topHeight = 0
					for item in buffer
						itemTop = item.element.offset().top
						newRow = rowTop isnt itemTop
						rowTop = itemTop
						itemHeight = item.element.outerHeight(true) if newRow
						if newRow and (viewport.topDataPos() + topHeight + itemHeight < viewport.topVisiblePos())
							topHeight += itemHeight
						else
							topVisible(item) if newRow
							break

				adjustBuffer = (rid) ->

					# We need the item bindings to be processed before we can do adjustment
					$timeout ->

						processBufferedItems(rid)

						if shouldLoadBottom()
							enqueueFetch(rid, true)
						else
							if shouldLoadTop()
								enqueueFetch(rid, false)

						if pending.length == 0
							calculateTopProperties()

				adjustBufferAfterFetch = (rid) ->

					# We need the item bindings to be processed before we can do adjustment
					$timeout ->

						keepFetching = processBufferedItems(rid)

						if shouldLoadBottom()
							# keepFetching = true means that at least one item app/prepended in the last batch had height > 0
							enqueueFetch(rid, true) if keepFetching
						else
							if shouldLoadTop()
								# pending[0] = true means that previous fetch was appending. We need to force at least one prepend
								# BTW there will always be at least 1 element in the pending array because bottom is fetched first
								enqueueFetch(rid, false) if keepFetching || pending[0]

						pending.shift()
						if pending.length == 0
							loading(false)
							calculateTopProperties()
						else
							fetch(rid)

				fetch = (rid) ->
					#log "Running fetch... #{{true:'bottom', false: 'top'}[direction]} pending #{pending.length}"
					if pending[0] # scrolling down
						if buffer.length && !shouldLoadBottom()
							adjustBufferAfterFetch rid
						else
							#log "appending... requested #{bufferSize} records starting from #{next}"
							datasource.get next, bufferSize,
							(result) ->
								return if (rid and rid isnt ridActual) or $scope.$$destroyed
								if result.length < bufferSize
									eof = true
									viewport.bottomPadding(0)
									#log 'eof is reached'
								if result.length > 0
									clipTop()
									for item in result
										++next
										buffer.insert 'append', item
										#log 'appended: requested ' + bufferSize + ' received ' + result.length + ' buffer size ' + buffer.length + ' first ' + first + ' next ' + next
								adjustBufferAfterFetch rid
					else
						if buffer.length && !shouldLoadTop()
							adjustBufferAfterFetch rid
						else
							#log "prepending... requested #{size} records starting from #{start}"
							datasource.get first-bufferSize, bufferSize,
							(result) ->
								return if (rid and rid isnt ridActual) or $scope.$$destroyed
								if result.length < bufferSize
									bof = true
									viewport.topPadding(0)
									#log 'bof is reached'
								if result.length > 0
									clipBottom() if buffer.length
									for i in [result.length-1..0]
										--first
										buffer.insert 'prepend', result[i]
									#log 'prepended: requested ' + bufferSize + ' received ' + result.length + ' buffer size ' + buffer.length + ' first ' + first + ' next ' + next
								adjustBufferAfterFetch rid


				# events and bindings

				resizeAndScrollHandler = ->
					if !$rootScope.$$phase && !adapter.isLoading
						adjustBuffer()
						$scope.$apply()

				wheelHandler = (event) ->
					scrollTop = viewport[0].scrollTop
					yMax = viewport[0].scrollHeight - viewport[0].clientHeight
					if (scrollTop is 0 and not bof) or (scrollTop is yMax and not eof)
						event.preventDefault()

				viewport.bind 'resize', resizeAndScrollHandler
				viewport.bind 'scroll', resizeAndScrollHandler
				viewport.bind 'mousewheel', wheelHandler

				$scope.$watch datasource.revision, reloadImpl

				$scope.$on '$destroy', ->
					# clear the buffer. It is necessary to remove the elements and $destroy the scopes
					buffer.clear()
					viewport.unbind 'resize', resizeAndScrollHandler
					viewport.unbind 'scroll', resizeAndScrollHandler
					viewport.unbind 'mousewheel', wheelHandler


				# adapter setup

				adapter = {}
				adapter.isLoading = false
				adapter.reload = reloadImpl

				applyUpdate = (wrapper, newItems) ->
					if angular.isArray newItems
						pos = (buffer.indexOf wrapper) + 1
						for newItem,i in newItems.reverse()
							if newItem == wrapper.scope[itemName]
								keepIt = true;
								pos--
							else
								buffer.insert pos, newItem
						unless keepIt
							wrapper.op = 'remove'

				adapter.applyUpdates = (arg1, arg2) ->
					dismissPendingRequests()
					if angular.isFunction arg1
						# arg1 is the updater function, arg2 is ignored
						bufferClone = buffer.slice(0)
						for wrapper,i in bufferClone  # we need to do it on the buffer clone, because buffer content
							# may change as we iterate through
							applyUpdate wrapper, arg1(wrapper.scope[itemName], wrapper.scope, wrapper.element)
					else
						# arg1 is item index, arg2 is the newItems array
						if arg1%1 == 0 # checking if it is an integer
							if 0 <= arg1-first < buffer.length
								applyUpdate buffer[arg1 - first], arg2
						else
							throw new Error 'applyUpdates - ' + arg1 + ' is not a valid index'
					adjustBuffer ridActual

				adapter.append = (newItems) ->
					dismissPendingRequests()
					for item in newItems
						++next
						buffer.insert 'append', item
					adjustBuffer ridActual

				adapter.prepend = (newItems) ->
					dismissPendingRequests()
					for item in newItems.reverse()
						--first
						buffer.insert 'prepend', item
					adjustBuffer ridActual

				if $attr.adapter # so we have an adapter on $scope
					adapterOnScope = $parse($attr.adapter)($scope)
					if not angular.isObject adapterOnScope
						$parse($attr.adapter).assign($scope, {})
						adapterOnScope = $parse($attr.adapter)($scope)
					angular.extend(adapterOnScope, adapter)
					adapter = adapterOnScope


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
