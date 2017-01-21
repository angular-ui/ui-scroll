var path = require('path');
var webpack = require('webpack');

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

/**** plugins ****/

var packageJSON = require('./package.json');
var CleanWebpackPlugin = require('clean-webpack-plugin');

var banner =
  packageJSON.name + '\n' +
  packageJSON.homepage + '\n' +
  'Version: ' + packageJSON.version + ' -- ' + (new Date()).toISOString() + '\n' +
  'License: ' + packageJSON.license;

var plugins = [
  new CleanWebpackPlugin(['temp'], {
    root: process.cwd(),
    verbose: true,
    dry: false,
  })
];

module.exports.devPlugins = plugins.concat([]);

module.exports.prodPlugins = plugins.concat([
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: true,
    },
    output: {
      comments: false,
    },
  }),
  new webpack.BannerPlugin(banner)
]);