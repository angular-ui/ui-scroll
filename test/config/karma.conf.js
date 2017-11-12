var chrome = process.platform === 'linux' ? 'Chromium' : 'Chrome';
var firefox = 'Firefox';
var ie = 'IE';

module.exports = function (config) {
  config.set({

    basePath: '',

    frameworks: ['jasmine'],

    files: require('./karma.conf.files.js').defaultFiles,

    exclude: [],

    reporters: ['dots'],

    port: 8082,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    keepalive: true,

    browsers: process.env.TRAVIS ?
      [firefox, chrome] :
      [chrome],

    captureTimeout: 60000,

    singleRun: false
  });
};
