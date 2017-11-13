const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const packageJSON = require('../package.json');

const getBanner = function (compressed) {
  return packageJSON.name + (compressed ? ' (compressed)' : ' (uncompressed)') + '\n' +
    packageJSON.homepage + '\n' +
    'Version: ' + packageJSON.version + ' -- ' + (new Date()).toISOString() + '\n' +
    'License: ' + packageJSON.license;
};

const ENV = (process.env.npm_lifecycle_event.indexOf('dev') === 0) ? 'development' : 'production';

let configEnv = {};

if (ENV === 'development') {
  configEnv = {
    entry: {},

    output: {
      path: path.join(__dirname, '../temp'),
      filename: '[name].js'
    },

    plugins: [
      new CleanWebpackPlugin('temp', {
        root: path.join(__dirname, '..')
      }),
      new webpack.BannerPlugin(getBanner(false))
    ],

    watch: true
  }
}

if (ENV === 'production') {
  configEnv = {
    entry: {
      'ui-scroll.min': path.resolve(__dirname, '../src/ui-scroll.js'),
      'ui-scroll-grid.min': path.resolve(__dirname, '../src/ui-scroll-grid.js')
    },

    output: {
      path: path.join(__dirname, '../dist'),
      filename: '[name].js'
    },

    plugins: [
      new CleanWebpackPlugin('dist', {
        root: path.join(__dirname, '..')
      }),
      new webpack.BannerPlugin(getBanner(true)),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compress: {
          warnings: true,
        },
        output: {
          comments: false,
        },
        include: /\.min\.js$/
      })
    ],

    watch: false
  }
}

module.exports = {
  entry: Object.assign({
    'ui-scroll': path.resolve(__dirname, '../src/ui-scroll.js'),
    'ui-scroll-grid': path.resolve(__dirname, '../src/ui-scroll-grid.js')
  }, configEnv.entry),

  output: configEnv.output,

  cache: false,

  devtool: 'source-map',

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader?presets[]=es2015'
    }]
  },

  resolve: {
    extensions: ['.js'],
    modules: [
      __dirname,
      path.resolve(__dirname, '../node_modules')
    ]
  },

  plugins: configEnv.plugins,

  watch: configEnv.watch
};
