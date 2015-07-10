angular.module('application', ['ui.scroll', 'ui.scroll.jqlite'])
	.factory( 'datasource',
		[ '$log', '$timeout'

			(console, $timeout)->

				get = (index, count, success)->

					result = []

					start = Math.max(1, index)
					end = Math.min(index + count-1, 3)

					if (start > end)
						success result
					else
						for i in [start..end]
							result.push "item #{i}"
						success(result)

				{get}

		])
	.controller('main', ($scope) ->
			$scope.click = ->
				$scope.adapter.applyUpdates(
					2, ["item 2", "two"]
					#(item, scope) -> [item + ' *' + scope.$index]
				)
		)

angular.bootstrap(document, ["application"])

###
//# sourceURL=src/applyUpdate.js
###