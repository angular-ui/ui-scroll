angular.module('application', ['ui.scroll', 'ui.scroll.jqlite'])
	.controller('mainController',
	[ '$scope', '$timeout', '$log'
		($scope, $timeout, console) ->

			$scope.datasource =
				get: (index, count, success) ->
					result = []
					for i in [index..index + count-1]
						result.push "item ##{i}"
					success(result)

			$scope.updateMinIndex = ->
				$scope.datasource.minIndex = -20

			$scope.scroll = ->
				console.log angular.element(document.getElementById('div')).triggerHandler('scroll')
				#angular.element(document.getElementById('div')).triggerHandler('scroll')
				#angular.element(document.getElementById('div')).triggerHandler('scroll')
				#$scope.adapter.test()

			document.getElementById('scroll').onclick =
				->
					document.getElementById('div').scrollTop += 10
					#console.log
					$scope.adapter.test()

#			document.getElementById('div').onclick =
#				->
#					document.getElementById('div').scrollTop += 10
					#console.log
#					$scope.adapter.test()
#					$scope.$apply()

	])
angular.bootstrap(document, ["application"])

###
//# sourceURL=src/customviewport.js
###