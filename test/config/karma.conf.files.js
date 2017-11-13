var scrollerPath = '../../temp/'

var files = [
  'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-mocks.js',
  '../misc/test.css',
  '../misc/datasources.js',
  '../misc/scaffolding*.js',
  '../*Spec.js'
];

module.exports.development = files.concat([
  '../../temp/ui-scroll.js',
  '../../temp/ui-scroll-grid.js',
  {
    pattern: '../../temp/*.js.map',
    included: false
  }
]);

module.exports.production = files.concat([
  '../../dist/ui-scroll.min.js',
  '../../dist/ui-scroll-grid.min.js',
  {
    pattern: '../../dist/*.js.map',
    included: false
  }
]);
