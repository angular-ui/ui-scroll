angular.module('application', ['ui.scroll', 'ui.scroll.jqlite'])
.factory('datasource',
		[ '$log', '$timeout'

			(console, $timeout)->
				get = (index, count, success)->
					$timeout(
						->
							result = []
							for i in [index..index + count - 1]
								item = {}
								if inlineDemo
									item.width = inlineDemo.getWidth(i)
									item.height = inlineDemo.getHeight(i)
									item.color = inlineDemo.getColor(i)
								item.content =  "item ##{i}"
								result.push item
							success(result)
						100
					)

				{get}

		])
angular.bootstrap(document, ["application"])

###
//# sourceURL=src/windowviewportInline.js
###