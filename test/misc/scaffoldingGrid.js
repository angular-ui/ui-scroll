/* exported runGridTest */

function createGridHtml (settings) {
  'use strict';
  var viewportStyle = ' style="height:' + (settings.viewportHeight || 200) + 'px"';
  var columns = ['col0', 'col1', 'col2', 'col3'];

  var html =
    '<table ui-scroll-viewport ' + viewportStyle + ' >' +
      '<thead style="display:block">' +
        '<tr>';
  columns.forEach(col => { html +=
          '<th ui-scroll-th class="' + col + '">' + col + '</th>';
  }); html +=
        '</tr>' +
      '</thead>' +
      '<tbody class="grid">' +
        '<tr ui-scroll="item in ' + settings.datasource + '" adapter="adapter">';
        if(settings.rowTemplate) {
          html += settings.rowTemplate;
        } else {
          columns.forEach(col => { html +=
            '<td ui-scroll-td class="' + col + '">{{item.' + col + '}}</td>';
          });
        } html +=
        '</tr>' +
      '</tbody>' +
    '</table>';
  return html;
}

function finalize(scroller, options, scope, $timeout) {
  'use strict';
  options = options || {};
  scroller.remove();

  if (typeof options.cleanupTest === 'function') {
    options.cleanupTest(scroller, scope, $timeout);
  }
}

function runGridTest(scrollSettings, run, options) {
  'use strict';
  options = options || {};
  inject(function($rootScope, $compile, $window, $timeout) {
    var scroller = angular.element(createGridHtml(scrollSettings));
    var scope = $rootScope.$new();

    angular.element(document).find('body').append(scroller);
    var head = angular.element(scroller.children()[0]);
    var body = angular.element(scroller.children()[1]);

    if (options.scope) {
      angular.extend(scope, options.scope);
    }

    $compile(scroller)(scope);

    scope.$apply();
    $timeout.flush();

    try {
      run(head, body, scope, $timeout);
    } finally {
      finalize(scroller, options, scope, $timeout);
    }
  });
}