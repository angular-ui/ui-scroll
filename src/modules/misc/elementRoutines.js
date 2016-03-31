export class ElementRoutines {

	constructor ($injector) {
		this.$animate = ($injector.has && $injector.has('$animate')) ? $injector.get('$animate') : null;
		this.isAngularVersionLessThen1_3 = angular.version.major === 1 && angular.version.minor < 3;
	}

	insertElement(newElement, previousElement) {
		previousElement.after(newElement);
		return [];
	}

	removeElement(wrapper) {
		wrapper.element.remove();
		wrapper.scope.$destroy();
		return [];
	}

	insertElementAnimated(newElement, previousElement) {
		if (!this.$animate) {
			return insertElement(newElement, previousElement);
		}

		if (this.isAngularVersionLessThen1_3) {
			const deferred = $q.defer();
			// no need for parent - previous element is never null
			this.$animate.enter(newElement, null, previousElement, () => deferred.resolve());

			return [deferred.promise];
		}

		// no need for parent - previous element is never null
		return [this.$animate.enter(newElement, null, previousElement)];
	}

	removeElementAnimated(wrapper) {
		if (!this.$animate) {
			return removeElement(wrapper);
		}

		if (this.isAngularVersionLessThen1_3) {
			const deferred = $q.defer();
			this.$animate.leave(wrapper.element, () => {
				wrapper.scope.$destroy();
				return deferred.resolve();
			});

			return [deferred.promise];
		}

		return [(this.$animate.leave(wrapper.element)).then(() => wrapper.scope.$destroy())];
	}
}
