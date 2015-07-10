angular.module('application', ['ui.scroll', 'ui.scroll.jqlite']).controller('mainController',
	[ '$scope', '$log', '$timeout'
		($scope, console, $timeout)->
			datasource = {}

			datasource.cache = {

				initialize: () ->
					this.isEnabled = true
					this.items = {}
					this.getPure = datasource.get
					datasource.get = this.getCached

				getCached: (index, count, successCallback) ->
					self = datasource.cache

					if self.isEnabled
						return if self.getItems index, count, successCallback
						return self.getPure index, count, (result) ->
							self.saveItems index, count, result
							successCallback result

					return self.getPure index, count, successCallback

				toggle: () ->
					this.isEnabled = not this.isEnabled
					this.items = {}

				saveItems: (index, count, resultItems) ->
					for item, i in resultItems
						if !this.items.hasOwnProperty(index + i)
							this.items[index + i] = item

				getItems: (index, count, successCallback) ->
					result = []
					isCached = true

					for i in [index..index + count - 1] by 1
						if not this.items.hasOwnProperty(i)
							isCached = false
							return
						result.push this.items[i]

					successCallback result
					return true

			}


			#this method is not changed; it is the same as in non-cache case
			datasource.get = (index, count, success)->
				$timeout () ->
					result = []
					for i in [index..index + count - 1]
						item = {}
						item.content = "item ##{i}"
						item.data = {
							some: false
						}
						result.push item
					success result
				, 100

			$scope.datasource = datasource


			#don't forget to init cache
			datasource.cache.initialize()

	])

angular.bootstrap(document, ["application"])

###
//# sourceURL=src/cache.js
###