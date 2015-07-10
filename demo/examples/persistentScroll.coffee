angular.module('application', ['ui.scroll', 'ui.scroll.jqlite'])
	.factory( 'datasource',
		[ '$log', '$timeout', '$rootScope', '$location'

			(console, $timeout, $rootScope, $location)->

				offset = parseInt($location.search().offset || '0')

				get = (index, count, success)->
					$timeout(
						->
							actualIndex = index + offset
							result = []

							start = Math.max(-40, actualIndex)
							end = Math.min(actualIndex + count-1, 100)

							if (start > end)
								success result
							else
								for i in [start..end]
									result.push "item #{i}"
								success(result)
						100
					)

				$rootScope.$watch (-> $rootScope.topVisible),
					->
						if $rootScope.topVisible
							$location.search('offset', $rootScope.topVisible.$index + offset)
							$location.replace()
				{
					get
				}

		])
angular.bootstrap(document, ["application"])

###
//# sourceURL=src/persistentScroll.js
###