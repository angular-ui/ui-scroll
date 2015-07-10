angular.module('application', ['ui.scroll', 'ui.scroll.jqlite']).controller('mainController',
		[ '$scope', '$log', '$timeout'

			($scope, console, $timeout)->

				datasource = {}

				datasource.get = (index, count, success)->
					$timeout(
						->
							result = []
							for i in [index..index + count-1]
								result.push "item ##{i}"
							success(result)
						100
					)

				$scope.datasource =  datasource

		])

angular.bootstrap(document, ["application"])

###
//# sourceURL=src/scopeDatasource.js
###