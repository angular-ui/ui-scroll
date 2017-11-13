var path = require('path');
var webpack = require('webpack');

var packageJSON = require('../package.json');

var getBanner = function (compressed) {
  return packageJSON.name + (compressed ? ' (compressed)' : ' (uncompressed)') + '\n' +
    packageJSON.homepage + '\n' +
    'Version: ' + packageJSON.version + ' -- ' + (new Date()).toISOString() + '\n' +
    'License: ' + packageJSON.license;
};

var ENV = '';
switch (process.env.npm_lifecycle_event) {
  case 'dev-build':
    ENV = 'development';
    break;
  case 'build':
    ENV = 'production';
    break;
}

var _plugins = [];
var _output = {};

if (ENV === 'development') {
  _plugins = [new webpack.BannerPlugin(getBanner(false))];
  _output = {
    path: path.join(__dirname, '../temp'),
    filename: '[name].js'
  };
}

if (ENV === 'production') {
  _plugins = [
    new webpack.BannerPlugin(getBanner(true)),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: true,
      },
      output: {
        comments: false,
      },
    })
  ];
  _output = {
    path: path.join(__dirname, '../temp'),
    filename: '[name].min.js'
  };
}

module.exports = {
  entry: {
    'ui-scroll': path.resolve(__dirname, '../src/ui-scroll.js'),
    'ui-scroll-grid': path.resolve(__dirname, '../src/ui-scroll-grid.js')
  },
  output: _output,
  cache: false,
  devtool: 'source-map',
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader?presets[]=es2015'
    }]
  },
  plugins: _plugins,
  watch: true,
  resolve: {
    extensions: ['.js'],
    modules: [
      __dirname,
      path.resolve(__dirname, '../node_modules')
    ]
  }
};
