var scrollerPath = '../../temp/'

var files = [
  'http://code.jquery.com/jquery-1.9.1.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular-mocks.js',
  '../misc/test.css',
  '../misc/datasources.js',
  '../misc/scaffolding*.js',
  '../misc/helpers.js',
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
