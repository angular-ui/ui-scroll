export function uiScrollViewport() {
	return {
		controller: [
			'$scope',
			'$element',
			function (scope, element) {
				this.viewport = element;
				return this;
			}
		]
	};
}