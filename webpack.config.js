'use strict';

const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const packageJSON = require('./package.json');

const getBanner = () =>
  packageJSON.name + '\n' +
  packageJSON.homepage + '\n' +
  'Version: ' + packageJSON.version + ' -- ' + (new Date()).toISOString() + '\n' +
  'License: ' + packageJSON.license;

const scriptName = process.env.npm_lifecycle_event;
const ENV = scriptName.indexOf('dev') === 0 ? 'development' : 'production';
const isTest = scriptName.indexOf('test') >= 0;

console.log('***** webpack runs in ' + ENV + (isTest ? ' (test)' : '') + ' environment\n');

const devServerPort = 5005;
const devServerHost = 'localhost';
let configEnv;

if (ENV === 'development') {
  configEnv = {
    entry: isTest ? ({
      'test': glob.sync(path.resolve(__dirname, 'test/*.js'))
    }) : ({}),

    output: {
      filename: '[name].js',
      publicPath: '/'
    },

    devtool: 'inline-source-map',

    plugins: [],

    optimization: {},

    devServer: !isTest ? {
      historyApiFallback: {
        rewrites: [
          { from: /\/*\/*\.html$/, to: (context) => '/demo' + context.parsedUrl.pathname },
          { from: /\/*\/*\.css$/, to: (context) => '/demo' + context.parsedUrl.pathname },
          { from: /\/*\/*\.js$/, to: (context) => '/demo' + context.parsedUrl.pathname },
          { from: /\/ui-scroll-demo\.gif$/, to: '/demo/ui-scroll-demo.gif' },
          { from: /^\/$/, to: '/demo/index.html' }
        ]
      },
      proxy: {
        '/dist': {
          target: 'http://' + devServerHost + ':' + devServerPort,
          pathRewrite: { '^/dist': '' }
        }
      },
      inline: true,
      quiet: false,
      stats: {
        modules: false,
        errors: true,
        warnings: true
      },
      port: devServerPort,
      host: devServerHost,
      publicPath: '/'
    } : {},

    watch: true
  }
}

if (ENV === 'production') {
  configEnv = {
    entry: {
      'ui-scroll.min': path.resolve(__dirname, 'src/ui-scroll.js'),
      'ui-scroll-grid.min': path.resolve(__dirname, 'src/ui-scroll-grid.js')
    },

    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js'
    },

    devtool: 'source-map',

    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          sourceMap: true,
          parallel: true,
          extractComments: false,
          terserOptions: {
            warnings: true,
            compress: {
              warnings: true,
            },
            output: {
              comments: false,
            },
          },
          include: /\.min\.js$/
        })
      ],
    },

    plugins: [
      new CleanWebpackPlugin('dist', {
        root: __dirname
      }),
      new CopyWebpackPlugin([
        { from: 'src/ui-scroll-jqlite.js', to: 'ui-scroll-jqlite.min.js' },
        { from: 'src/ui-scroll-jqlite.js', to: 'ui-scroll-jqlite.js' }
      ], { copyUnmodified: true }),
      new webpack.BannerPlugin(getBanner())
    ],

    devServer: {},

    watch: false
  }
}

module.exports = {
  entry: Object.assign({
    'ui-scroll': path.resolve(__dirname, 'src/ui-scroll.js'),
    'ui-scroll-grid': path.resolve(__dirname, 'src/ui-scroll-grid.js')
  }, configEnv.entry),

  output: configEnv.output,

  cache: false,

  devtool: configEnv.devtool,

  mode: ENV,

  optimization: configEnv.optimization,

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },

  plugins: configEnv.plugins,

  devServer: configEnv.devServer,

  watch: configEnv.watch
};
