// BROWSER env variable could be "headless", "firefox" or "chrome" (default)

const browsers = [];
if (process.env.BROWSER === 'headless') {
  process.env.CHROME_BIN = require('puppeteer').executablePath();
  browsers.push('ChromeHeadlessSized');
} else if (process.env.BROWSERS === "firefox") {
  browsers.push('FirefoxSized');
} else {
  browsers.push(process.platform === 'linux' ? ['ChromiumSized'] : ['ChromeSized']);
}

const flags = ['--window-size=1024,768'];
const customLaunchers = {
  'ChromeHeadlessSized': { base: 'ChromeHeadless', flags },
  'ChromiumSized': { base: 'Chromium', flags },
  'ChromeSized': { base: 'Chrome', flags },
  'FirefoxSized': { base: 'Firefox', flags }
};

const ENV = (!process.env.CI && process.env.npm_lifecycle_event.indexOf('dev') === 0) ?
  'development' :
  'production';

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

    browsers,
    customLaunchers,

    captureTimeout: 60000,

    singleRun: ENV !== 'development'

  }, webpackSettings));
};
