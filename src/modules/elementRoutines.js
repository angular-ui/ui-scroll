const hideClassToken = 'ng-ui-scroll-hide';

function addCSSRule(sheet, rules, _index) {
  const selector = '.' + hideClassToken;
  let index;
  try {
    index = sheet.cssRules.length;
    index = _index < index && _index >= 0 ? _index : index;
  } catch (err) {
    index = 0;
  }
  if('insertRule' in sheet) {
    sheet.insertRule(selector + '{' + rules + '}', index);
  }
  else if('addRule' in sheet) {
    sheet.addRule(selector, rules, index);
  }
}

export default class ElementRoutines {

  constructor($injector, $q, uiScrollService) {
    this.$animate = ($injector.has && $injector.has('$animate')) ? $injector.get('$animate') : null;
    this.isAngularVersionLessThen1_3 = angular.version.major === 1 && angular.version.minor < 3;
    this.$q = $q;
    if (uiScrollService.count() === 1) {
      addCSSRule(document.styleSheets[0], 'display: none'); 
    }
  }

  hideElement(wrapper) {
    wrapper.element.addClass(hideClassToken);
  }

  showElement(wrapper) {
    wrapper.element.removeClass(hideClassToken);
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
      return this.insertElement(newElement, previousElement);
    }

    if (this.isAngularVersionLessThen1_3) {
      const deferred = this.$q.defer();
      // no need for parent - previous element is never null
      this.$animate.enter(newElement, null, previousElement, () => deferred.resolve());

      return [deferred.promise];
    }

    // no need for parent - previous element is never null
    return [this.$animate.enter(newElement, null, previousElement)];
  }

  removeElementAnimated(wrapper) {
    if (!this.$animate) {
      return this.removeElement(wrapper);
    }

    if (this.isAngularVersionLessThen1_3) {
      const deferred = this.$q.defer();
      this.$animate.leave(wrapper.element, () => {
        wrapper.scope.$destroy();
        return deferred.resolve();
      });

      return [deferred.promise];
    }

    return [(this.$animate.leave(wrapper.element)).then(() => wrapper.scope.$destroy())];
  }
}