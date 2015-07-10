angular.module('application', ['ui.scroll', 'ui.scroll.jqlite']).controller('mainController',
	[ '$scope', '$log', '$timeout'
		($scope, console, $timeout)->

			# datasource implementation

			datasource = {}

			datasource.get = (index, count, success)->
				$timeout(
					->
						result = []
						for i in [index..index + count-1]
							item = {}
							item.id = i
							item.content = "item #" + i
							result.push item
						success(result)
					100
				)

			$scope.datasource =  datasource


			# 1st list adapter implementation

			$scope.firstListAdapter = remain: true

			$scope.updateList1 = ->
				$scope.firstListAdapter.applyUpdates (item, scope) ->
					item.content += ' *'

			$scope.removeFromList1 = ->
				$scope.firstListAdapter.applyUpdates (item, scope) ->
					if scope.$index % 2 == 0
						return []

			idList1 = 1000

			$scope.addToList1 = ->
				$scope.firstListAdapter.applyUpdates (item, scope) ->
					newItem = undefined
					if scope.$index == 2
						newItem =
							id: idList1
							content: 'a new one #' + idList1
						idList1++
						return [
							item
							newItem
						]
					return


			# 2nd list adapter implementation

			$scope.updateList2 = ->
				$scope.second.list.adapter.applyUpdates (item, scope) ->
					item.content += ' *'

			$scope.removeFromList2 = ->
				$scope.second.list.adapter.applyUpdates (item, scope) ->
					if scope.$index % 2 != 0
						return []

			idList2 = 2000

			$scope.addToList2 = ->
				$scope.second.list.adapter.applyUpdates (item, scope) ->
					newItem = undefined
					if scope.$index == 4
						newItem =
							id: idList2
							content: 'a new one #' + idList1
						idList2++
						return [
							item
							newItem
						]
					return

	])

angular.bootstrap(document, ["application"])

###
//# sourceURL=src/adapter.js
###