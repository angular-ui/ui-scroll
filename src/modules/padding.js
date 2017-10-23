const CacheFactory = {
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
  },

  remove(itemToRemove) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (this[i].index === itemToRemove.scope.$index) {
        this.splice(i, 1);
        break;
      }
    }
    if(itemToRemove._op !== 'isTop') {
      for (let i = this.length - 1; i >= 0; i--) {
        if (this[i].index > itemToRemove.scope.$index) {
          this[i].index--;
        }
      }
    }
  },

  clear() {
    this.length = 0;
  }
};

function Cache() {
  return Object.assign(Object.create(Array.prototype), CacheFactory);
}


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