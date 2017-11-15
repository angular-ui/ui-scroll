const path = require('path');
const fs = require('fs');
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

const arrTestFiles = fs.readdirSync('test')
  .map(e => (e.indexOf('Spec.js') !== -1) ?
    {[e.replace(/\.js/, '')]: path.resolve(__dirname, '../test/' + e)} : null
  )
  .filter(e => e !== null);

let testFiles = {};
arrTestFiles.forEach(e => testFiles[Object.keys(e)[0]] = e[Object.keys(e)[0]]);

if (ENV === 'development') {
  configEnv = {
    output: {
      filename: '[name].js'
    },

    rules: [{
      enforce: 'pre',
      test: /Spec\.js$/,
      include: path.resolve(__dirname, '../test'),
      use: [{
        loader: 'jshint-loader'
      }]
    }],

    devtool: 'inline-source-map',

    entry: testFiles,

    plugins: [],

    devServer: {
      historyApiFallback: {
        rewrites: [
          { from: /^\/$/, to: '/demo/index.html' },
          { from: /\/ui-scroll-demo\.gif$/, to: '/demo/ui-scroll-demo.gif' },
          { from: /\/*\/*\.html$/, to: (context) => '/demo' + context.parsedUrl.pathname },
          { from: /\/*\/*\.css$/, to: (context) => '/demo' + context.parsedUrl.pathname },
          { from: /\/*\/*\.js$/, to: (context) => '/demo' + context.parsedUrl.pathname }
        ]
      },
      inline: true,
      quiet: false,
      hot: true,
      port: 5005,
      publicPath: path.join(__dirname, '../')
    },

    watch: true
  }
}

if (ENV === 'production') {
  configEnv = {
    output: {
      path: path.join(__dirname, '../dist'),
      filename: '[name].js'
    },

    rules: [],

    devtool: 'source-map',

    entry: {
      'ui-scroll.min': path.resolve(__dirname, '../src/ui-scroll.js'),
      'ui-scroll-grid.min': path.resolve(__dirname, '../src/ui-scroll-grid.js')
    },

    plugins: [
      new CleanWebpackPlugin('dist', {
        root: path.join(__dirname, '..')
      }),
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
      ], {copyUnmodified: true}),
      new webpack.BannerPlugin(getBanner(true))
    ],

    devServer: {},

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

  devtool: configEnv.devtool,

  module: {
    rules: [...configEnv.rules,
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

  plugins: configEnv.plugins,

  devServer: configEnv.devServer,

  watch: configEnv.watch
};
