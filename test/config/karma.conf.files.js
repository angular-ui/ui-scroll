const files = [
  'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-mocks.js',
  '../misc/test.css',
  '../misc/datasources.js',
  '../misc/scaffolding*.js',
  '../misc/helpers.js',
  {
    pattern: '../*Spec.js',
    watched: false,
    served: true,
    included: true
  }
];

module.exports.development = [
  ...files,
  '../../src/ui-scroll.js',
  '../../src/ui-scroll-grid.js'
];

module.exports.production = [
  ...files,
  '../../dist/ui-scroll.min.js',
  '../../dist/ui-scroll-grid.min.js',
  {
    pattern: '../../dist/*.js.map',
    included: false
  }
];
