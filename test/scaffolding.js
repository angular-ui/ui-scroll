var createHtml = function (settings) {
    var viewportStyle = ' style="height:' + (settings.viewportHeight || 200) + 'px"';
    var itemStyle = settings.itemHeight ? ' style="height:' + settings.itemHeight + 'px"' : '';
    var bufferSize = settings.bufferSize ? ' buffer-size="' + settings.bufferSize + '"' : '';
    var isLoading = settings.isLoading ? ' is-loading="' + settings.isLoading + '"' : '';
    var topVisible = settings.topVisible ? ' top-visible="' + settings.topVisible + '"' : '';
    var adapter = settings.adapter ? ' adapter="' + settings.adapter + '"' : '';
    var template = settings.template ? settings.template : '{{$index}}: {{item}}';
    return '<div ui-scroll-viewport' + viewportStyle + '>' +
        '<div ui-scroll="item in ' + settings.datasource + '"' +
        adapter +
        itemStyle + bufferSize + isLoading + topVisible + '>' +
        template +
        '</div>' +
        '</div>';
};

var runTest = function (scrollSettings, run, options) {
    inject(function ($rootScope, $compile, $window, $timeout) {
            var scroller = angular.element(createHtml(scrollSettings));
            var scope = $rootScope.$new();

            //if (angular.element(document).find('body').find('div').children().length)
                //debugger

            angular.element(document).find('body').append(scroller);

            $compile(scroller)(scope);

            scope.$apply();
            $timeout.flush();

            try {
                run(scroller, scope, $timeout);
            } finally {
                scroller.remove();

                if (options && typeof options.cleanupTest === 'function') {
                    options.cleanupTest(scroller, scope, $timeout);
                }
            }

        }
    );
};
