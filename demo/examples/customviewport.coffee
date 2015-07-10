angular.module('application', ['ui.scroll', 'ui.scroll.jqlite'])
	.factory( 'datasource',
		[ '$log', '$timeout'

			(console, $timeout)->

				get = (index, count, success)->
					$timeout(
						->
							result = []
							for i in [index..index + count-1]
								result.push "item ##{i}"
							success(result)
						100
					)

				{get}

		])
angular.bootstrap(document, ["application"])

###
//# sourceURL=src/customviewport.js
###