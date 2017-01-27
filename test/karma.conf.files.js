var files = [
  'http://code.jquery.com/jquery-1.9.1.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular.js',
  'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular-mocks.js',
  'test.css',
  'datasources.js',
  'scaffolding.js',
  '**/*Spec.js',
  {
    pattern: '../temp/*.js.map',
    included: false
  }
];

module.exports.defaultFiles = files.concat([
  '../temp/ui-scroll.js',
  '../temp/ui-scroll-grid.js'
]);

module.exports.compressedFiles = files.concat([
  '../temp/ui-scroll.min.js',
  '../temp/ui-scroll-grid.min.js'
]);
