function Cache() {
  const cache = Object.create(Array.prototype);

  angular.extend(cache, {
    add(item) {
      for (let i = cache.length - 1; i >= 0; i--) {
        if (cache[i].index === item.scope.$index) {
          cache[i].height = item.element.outerHeight();
          return;
        }
      }
      cache.push({
        index: item.scope.$index,
        height: item.element.outerHeight()
      });
      cache.sort((a, b) => ((a.index < b.index) ? -1 : ((a.index > b.index) ? 1 : 0)));
    },

    remove(item) {
      for (let i = cache.length - 1; i >= 0; i--) {
        if (cache[i].index === item.scope.$index) {
          cache.splice(i, 1);
          break;
        }
      }
      for (let i = cache.length - 1; i >= 0; i--) {
        if (cache[i].index > item.scope.$index) {
          cache[i].index--;
        }
      }
    },

    clear() {
      cache.length = 0;
    }
  });

  return cache;
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