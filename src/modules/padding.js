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

  remove(argument) {
    const index = argument % 1 === 0 ? argument : argument.scope.$index;
    const isTop = argument % 1 === 0 ? false : argument._op === 'isTop';
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

export default function Padding(template) {
  let result;

  if(template.nodeType !== Node.ELEMENT_NODE) {
    throw new Error('ui-scroll directive requires an Element node for templating the view');
  }

  switch (template.tagName.toLowerCase()) {
    case 'dl':
      throw new Error(`ui-scroll directive does not support <${template.tagName}> as a repeating tag: ${template.outerHTML}`);
    case 'tr':
      let table = angular.element('<table><tr><td><div></div></td></tr></table>');
      result = table.find('tr');
      break;
    case 'li':
      result = angular.element('<li></li>');
      break;
    default:
      result = angular.element('<div></div>');
  }

  result.cache = new Cache();

  return result;
}