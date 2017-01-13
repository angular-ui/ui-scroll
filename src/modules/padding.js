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
    },
    clear() {
      cache.length = 0;
    }
  });

  return cache;
}

export default function Padding(template) {
  let result;

  switch (template.tagName) {
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