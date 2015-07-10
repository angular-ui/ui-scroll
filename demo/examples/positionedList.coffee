angular.module('application', ['ui.scroll', 'ui.scroll.jqlite'])
	.factory( 'datasource',
		[ '$log', '$timeout', '$rootScope', '$location'

			(console, $timeout, $rootScope, $location)->

				$rootScope.key = ""

				position = 0

				data = []

				for letter1 in 'abcdefghijk'
					for letter2 in 'abcdefghijk'
						for i in [0..9]
							data.push("#{letter1}#{letter2}: 0#{i}")

				get = (index, count, success)->
					$timeout(
						->
							actualIndex = index + position

							start = Math.max(0 - position, actualIndex)
							end = Math.min(actualIndex + count-1, data.length)

							if (start > end)
								success []
							else
								success data.slice(start, end+1)
						100
					)

				current = 0

				$rootScope.$watch ( -> $rootScope.key),
					->
						position = 0
						for record in data when $rootScope.key > record
							position++
						current++

				revision = -> current

				{
					get
					revision
				}

		])
angular.bootstrap(document, ["application"])

###
//# sourceURL=src/positionedList.js
###