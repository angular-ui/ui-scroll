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

_loaders = [{
  test: /\.js$/,
  exclude: /node_modules/,
  loader: 'babel-loader?presets[]=es2015'
}, {
  // './src/*.js', './src/modules/*.js'
  test: /\.\.\/src\/[a-z]*\.js/,
  exclude: /node_modules/,
  enforce: 'pre',
  loader: 'jshint-loader',
  options: Object.assign({}, require('../.jshintrc.json'), require('../src/.jshintrc.json'))
}];

let configEnv = {};

if (ENV === 'development') {
  configEnv = {
    outputFolder: 'temp',

    compressing: false,

    entry: {},

    module: {
      loaders: [..._loaders, {
        // './test/*Spec.js'
        test: /\.[/]test[/][a-z*]\.js/,
        exclude: /node_modules/,
        enforce: 'pre',
        loader: 'jshint-loader',
        options: Object.assign({}, require('../.jshintrc.json'), {
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
        })
      }
    ]},

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

    module: {
      loaders: _loaders
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

  devtool: 'source-map',

  module: configEnv.module,

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
