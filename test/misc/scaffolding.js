/* exported runTest */

function createHtml(settings) {
  'use strict';
  var viewportStyle = ' style="height:' + (settings.viewportHeight || 200) + 'px"';
  var itemStyle = settings.itemHeight ? ' style="height:' + settings.itemHeight + 'px"' : '';
  var bufferSize = settings.bufferSize ? ' buffer-size="' + settings.bufferSize + '"' : '';
  var padding = settings.padding ? ' padding="' + settings.padding + '"' : '';
  var isLoading = settings.isLoading ? ' is-loading="' + settings.isLoading + '"' : '';
  var topVisible = settings.topVisible ? ' top-visible="' + settings.topVisible + '"' : '';
  var disabled = settings.disabled ? ' disabled="' + settings.disabled + '"' : '';
  var adapter = settings.adapter ? ' adapter="' + settings.adapter + '"' : '';
  var template = settings.template ? settings.template : '{{$index}}: {{item}}';
  var startIndex = settings.startIndex ? ' start-index="' + settings.startIndex + '"' : '';
  var inertia = ' handle-inertia="false"';
  var extra = settings.extra || '';
  return '<div ui-scroll-viewport' + viewportStyle + '>' +
    (settings.wrapper ? settings.wrapper.start : '') +
    '<div class="item" ui-scroll="item in ' + settings.datasource + '"' +
    adapter +
    itemStyle + bufferSize + padding + isLoading + topVisible + disabled + startIndex + inertia + extra + '>' +
    template +
    '</div>' +
    (settings.wrapper ? settings.wrapper.end : '') +
    '</div>';
}

function finalize(scroller, options, scope, $timeout) {
  'use strict';
  options = options || {};
  scroller.remove();

  if (typeof options.cleanupTest === 'function') {
    options.cleanupTest(scroller, scope, $timeout);
  }
}

function augmentScroller(scroller) {
  'use strict';
  var scrollTop = scroller.scrollTop;
  scroller.scrollTop = function () {
    var result = scrollTop.apply(scroller, arguments);
    if (arguments.length) {
      scroller.trigger('scroll');
    }
    return result;
  };
}

function runTest(scrollSettings, run, options) {
  'use strict';
  options = options || {};
  inject(function ($rootScope, $compile, $window, $timeout) {
    var scroller = angular.element(createHtml(scrollSettings));
    var scope = $rootScope.$new();
    augmentScroller(scroller);

    angular.element(document).find('body').append(scroller);

    if (options.scope) {
      angular.extend(scope, options.scope);
    }

    var compile = function() {
      $compile(scroller)(scope);
      scope.$apply();
    };

    if (typeof options.catch === 'function') {
      try {
        compile();
      } catch (error) {
        options.catch(error);
      }
    } else {
      compile();
    }

    if(typeof run === 'function') {
      try {
        run(scroller, scope, $timeout);
      } finally {
        finalize(scroller, options, scope, $timeout);
      }
    }
  });
}