const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const packageJSON = require('../package.json');

const getBanner = function (compressing) {
  return packageJSON.name + (compressing ? ' (compressed)' : ' (uncompressed)') + '\n' +
    packageJSON.homepage + '\n' +
    'Version: ' + packageJSON.version + ' -- ' + (new Date()).toISOString() + '\n' +
    'License: ' + packageJSON.license;
};

const ENV = (process.env.npm_lifecycle_event.indexOf('dev') === 0) ? 'development' : 'production';
console.log('********** webpack runs in ' + ENV + ' environment **********\n');

let configEnv = {};

if (ENV === 'development') {
  configEnv = {
    outputFolder: 'temp',

    compressing: false,

    module: {
      rules: [{
        enforce: 'pre',
        test: /Spec\.js$/,
        include: path.resolve(__dirname, '../test'),
        use: [{
          loader: 'jshint-loader',
          options: {
            node: true,
            globals: {
              angular: false,
              inject: false,
              jQuery: false,
              jasmine: false,
              afterEach: false,
              beforeEach: false,
              ddescribe: false,
              describe: false,
              expect: false,
              iit: false,
              it: false,
              spyOn: false,
              xdescribe: false,
              xit: false
            }
          }
        }]
      }]
    },

    devtool: 'inline-source-map',

    entry: {},

    plugins: [],

    watch: true
  }
}

if (ENV === 'production') {
  configEnv = {
    outputFolder: 'dist',

    compressing: true,

    module: {},

    devtool: 'source-map',

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
      }),
      new CopyWebpackPlugin([
        {from: 'src/ui-scroll-jqlite.js', to: 'ui-scroll-jqlite.min.js'},
        {from: 'src/ui-scroll-jqlite.js', to: 'ui-scroll-jqlite.js'}
      ], {copyUnmodified: true})
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

  devtool: configEnv.devtool,

  module: {
    rules: [...configEnv.module.rules,
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['es2015']
        }
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        include: path.resolve(__dirname, '../src'),
        use: [{
          loader: 'jshint-loader'
        }]
      }
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
