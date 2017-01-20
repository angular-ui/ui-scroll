var path = require('path');
var webpack = require('webpack');
var packageJSON = require('./package.json');

module.exports.config = {
  entry: {
    'ui-scroll': './src/ui-scroll.js',
    'ui-scroll-grid': './src/ui-scroll-grid.js'
  },
  output: {
    path: path.join(__dirname, 'temp'),
    filename: '[name].js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};

var banner =
  packageJSON.name + '\n' +
  packageJSON.homepage + '\n' +
  'Version: ' + packageJSON.version + ' -- ' + (new Date()).toISOString() + '\n' +
  'License: ' + packageJSON.license;

module.exports.prodPlugins = [
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: true,
    },
    output: {
      comments: false,
    },
  }),
  new webpack.BannerPlugin(banner)
];