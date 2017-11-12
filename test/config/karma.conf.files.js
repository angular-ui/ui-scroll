var scrollerPath = '../../temp/'

var files = [
  'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-mocks.js',
  '../misc/test.css',
  '../misc/datasources.js',
  '../misc/scaffolding*.js',
  '../*Spec.js',
  {
    pattern: scrollerPath + '*.js.map',
    included: false
  }
];

module.exports.defaultFiles = files.concat([
  scrollerPath + 'ui-scroll.js',
  scrollerPath + 'ui-scroll-grid.js'
]);

module.exports.compressedFiles = files.concat([
  scrollerPath + 'ui-scroll.min.js',
  scrollerPath + 'ui-scroll-grid.min.js'
]);
