export default function Cache() {
	const cache = Object.create(Array.prototype);

	angular.extend(cache, {
		add(item) {
			for (let i = cache.length - 1; i >= 0; i--) {
				if(cache[i].index === item.scope.$index) {
					cache[i].height = item.element.outerHeight();
					return;
				}
			}
			cache.push({
				index: item.scope.$index,
				height: item.element.outerHeight()
			});
		},
		clear() {
			cache.length = 0;
		}
	});

	return cache;
}