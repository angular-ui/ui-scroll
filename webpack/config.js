const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const packageJSON = require('../package.json');

const getBanner = function (compressing) {
  return packageJSON.name + (compressing ? ' (compressed)' : ' (uncompressed)') + '\n' +
    packageJSON.homepage + '\n' +
    'Version: ' + packageJSON.version + ' -- ' + (new Date()).toISOString() + '\n' +
    'License: ' + packageJSON.license;
};

const ENV = (process.env.npm_lifecycle_event.indexOf('dev') === 0) ? 'development' : 'production';

let configEnv = {};

if (ENV === 'development') {
  configEnv = {
    outputFolder: 'temp',

    compressing: false,

    entry: {},

    plugins: [],

    watch: true
  }
}

if (ENV === 'production') {
  configEnv = {
    outputFolder: 'dist',

    compressing: true,

    entry: {
      'ui-scroll.min': path.resolve(__dirname, '../src/ui-scroll.js'),
      'ui-scroll-grid.min': path.resolve(__dirname, '../src/ui-scroll-grid.js')
    },

    plugins: [
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

  output: {
    path: path.join(__dirname, '../' + configEnv.outputFolder),
    filename: '[name].js'
  },

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

  plugins: [
    new CleanWebpackPlugin(configEnv.outputFolder, {
      root: path.join(__dirname, '..')
    }),
    ...configEnv.plugins,
    new webpack.BannerPlugin(getBanner(configEnv.compressing))
  ],

  watch: configEnv.watch
};
