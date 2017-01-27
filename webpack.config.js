var path = require('path');
var webpack = require('webpack');

var packageJSON = require('./package.json');

var getBanner = function (compressed) {
  return packageJSON.name + (compressed ? ' (compressed)' : ' (uncompressed)') + '\n' +
    packageJSON.homepage + '\n' +
    'Version: ' + packageJSON.version + ' -- ' + (new Date()).toISOString() + '\n' +
    'License: ' + packageJSON.license;
};

module.exports.config = {
  entry: {
    'ui-scroll': './src/ui-scroll.js',
    'ui-scroll-grid': './src/ui-scroll-grid.js'
  },
  output: {
    path: path.join(__dirname, 'temp'),
    filename: '[name].js'
  },
  cache: false,
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
  },
  plugins: [
    new webpack.BannerPlugin(getBanner(false))
  ]
};

module.exports.compressedPlugins = [
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: true,
    },
    output: {
      comments: false,
    },
  }),
  new webpack.BannerPlugin(getBanner(true))
];
