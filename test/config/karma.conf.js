// Karma configuration
// Generated on Sat Aug 10 2013 19:47:03 GMT-0500 (Central Daylight Time)

module.exports = function (config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: require('./karma.conf.files.js').defaultFiles,


    // add webpack as preprocessor
    preprocessors: { 'test/*Spec.js': ['webpack'] },


    // webpack configuration
    webpack: require('../../webpack/config.js'),


    // webpack-dev-middleware configuration
    webpackMiddleware: { stats: 'errors-only' },


    // list of files to exclude
    exclude: [],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['dots'],


    // web server port
    port: 8082,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    keepalive: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: process.env.TRAVIS ?
      ['Firefox'] :
      //['Chrome', 'IE', 'Firefox'],
      (process.platform === 'linux' ? ['Chromium'] : ['Chrome']),
    //browsers: ['Firefox'],
    //browsers = ['Chrome'];
    //browsers = ['IE'];


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
