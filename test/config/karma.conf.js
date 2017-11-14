const chrome = process.platform === 'linux' ? 'Chromium' : 'Chrome';
const firefox = 'Firefox';
const ie = 'IE';

const ENV = (process.env.npm_lifecycle_event.indexOf('dev') === 0) ? 'development' : 'production';
let webpackConfig = require('../../webpack/config.js');
// webpackConfig.entry = null;
webpackConfig.plugins = [];

module.exports = function (config) {
  config.set({

    basePath: '',

    frameworks: ['jasmine'],

    files: [
      ...require('./karma.conf.files.js')[ENV],
      {
        pattern: '../../src/*.js',
        watched: true,
        served: false
      }
    ],

    preprocessors: {
      '../../src/*.js': ['webpack']
    },

    webpack: webpackConfig,

    exclude: [],

    reporters: ['dots'],

    port: ENV === 'development' ? 9100 : 8082,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: ENV === 'development',

    keepalive: ENV === 'development',

    browsers: process.env.TRAVIS ?
      [firefox, chrome] :
      [chrome],

    captureTimeout: 60000,

    singleRun: ENV !== 'development',

    // restartOnFileChange: true
  });
};
