const chrome = process.platform === 'linux' ? 'Chromium' : 'Chrome';

const ENV = (process.env.npm_lifecycle_event.indexOf('dev') === 0) ? 'development' : 'production';

const webpackSettings = ENV === 'development' ? {
  preprocessors: {
    '../../src/ui-scroll*.js': ['webpack', 'sourcemap']
  },
  webpack: require('../../webpack.config.js')
} : {};

module.exports = function (config) {
  'use strict';

  config.set(Object.assign({

    basePath: '',

    frameworks: ['jasmine'],

    files: [
      ...require('./karma.conf.files.js')[ENV]
    ],

    exclude: [],

    reporters: ['dots'],

    port: ENV === 'development' ? 9100 : 8082,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: ENV === 'development',

    keepalive: ENV === 'development',

    browsers: process.env.TRAVIS ?
      ['Firefox'] :
      [chrome],

    captureTimeout: 60000,

    singleRun: ENV !== 'development'

  }, webpackSettings));
};
