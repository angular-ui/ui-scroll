angular.module('application', ['ui.scroll', 'ui.scroll.jqlite', 'ngAnimate']).controller('mainController',
	[ '$scope', '$log', '$timeout'
		($scope, console, $timeout)->

			# datasource implementation

			datasource = {}

			datasource.get = (index, count, success)->
				$timeout(
					->
						result = []
						for i in [index..index + count-1]
							continue if i <= 0 or i > 14
							item = {}
							item.id = i
							item.content = "item #" + i
							result.push item
						success(result)
					100
				)

			$scope.datasource =  datasource

			# adapter implementation

			$scope.adapterContainer = { adapter: { remain: true } }

			$scope.updateList = ->
				$scope.adapterContainer.adapter.applyUpdates (item, scope) ->
					item.content += ' *'

			$scope.removeFromList = ->
				$scope.adapterContainer.adapter.applyUpdates (item, scope) ->
					if scope.$index % 2 is 0
						return []

			idList = 1000

			$scope.addToList = ->
				$scope.adapterContainer.adapter.applyUpdates (item, scope) ->
					newItem = undefined
					if scope.$index is 2
						newItem =
							id: idList
							content: 'a new one #' + idList
						idList++
						return [
							item
							newItem
						]
					return

	])

angular.bootstrap(document, ["application"])

###
//# sourceURL=src/animation.js
###