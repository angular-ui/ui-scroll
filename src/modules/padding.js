// Can't just extend the Array, due to Babel does not support built-in classes extending
// This solution was taken from https://stackoverflow.com/questions/46897414/es6-class-extends-array-workaround-for-es5-babel-transpile
class CacheProto {
  add(item) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (this[i].index === item.scope.$index) {
        this[i].height = item.element.outerHeight();
        return;
      }
    }
    this.push({
      index: item.scope.$index,
      height: item.element.outerHeight()
    });
    this.sort((a, b) => ((a.index < b.index) ? -1 : ((a.index > b.index) ? 1 : 0)));
  }

  remove(argument, _isTop) {
    const index = argument % 1 === 0 ? argument : argument.scope.$index;
    const isTop = argument % 1 === 0 ? _isTop : argument._op === 'isTop';
    for (let i = this.length - 1; i >= 0; i--) {
      if (this[i].index === index) {
        this.splice(i, 1);
        break;
      }
    }
    if(!isTop) {
      for (let i = this.length - 1; i >= 0; i--) {
        if (this[i].index > index) {
          this[i].index--;
        }
      }
    }
  }

  clear() {
    this.length = 0;
  }
}

function Cache() {
  const instance = [];
  instance.push.apply(instance, arguments);
  Object.setPrototypeOf(instance, Cache.prototype);
  return instance;
}
Cache.prototype = Object.create(Array.prototype);
Object.getOwnPropertyNames(CacheProto.prototype).forEach(methodName =>
  Cache.prototype[methodName] = CacheProto.prototype[methodName]
);

function generateElement(template) {
  if(template.nodeType !== Node.ELEMENT_NODE) {
    throw new Error('ui-scroll directive requires an Element node for templating the view');
  }
  let element;
  switch (template.tagName.toLowerCase()) {
    case 'dl':
      throw new Error(`ui-scroll directive does not support <${template.tagName}> as a repeating tag: ${template.outerHTML}`);
    case 'tr':
      let table = angular.element('<table><tr><td><div></div></td></tr></table>');
      element = table.find('tr');
      break;
    case 'li':
      element = angular.element('<li></li>');
      break;
    default:
      element = angular.element('<div></div>');
  }
  return element;
}

class Padding {
  constructor(template) {
    this.element = generateElement(template);
    this.cache = new Cache();
  }

  height() {
    return this.element.height.apply(this.element, arguments);
  }
}

export default Padding;