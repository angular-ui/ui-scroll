module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-webpack');

  var webpackSettings = require('./webpack.config.js');

  grunt.initConfig({
    connect: {
      app: {
        options: {
          port: 5005,
          base: './demo',
          middleware: function (connect, options, middlewares) {
            middlewares.unshift(function (req, res, next) {
              var files = ['ui-scroll.js', 'ui-scroll-grid.js', 'ui-scroll.js.map', 'ui-scroll-grid.js.map'];
              for (var i = 0; i < files.length; i++) {
                if (req.url === '/dist/' + files[i]) {
                  res.end(grunt.file.read('./temp/' + files[i]));
                }
              }
              next();
            });
            return middlewares;
          }
        }
      }
    },
    watch: {
      options: {
        livereload: false,
        debounceDelay: 250
      },
      scripts: {
        files: [
          'src/**/*.js'
        ],
        tasks: 'webpack:default'
      }
    },
    karma: {
      options: {
        configFile: './test/karma.conf.js',
        runnerPort: 9100
      },
      default: {},
      compressed: {
        options: {
          files: require('./test/karma.conf.files.js').compressedFiles,
          port: 9876,
          autoWatch: false,
          keepalive: false,
          singleRun: true
        }
      }
    },
    webpack: {
      options: webpackSettings.config,
      default: {},
      compressed: {
        plugins: webpackSettings.compressedPlugins,
        output: {
          filename: '[name].min.js'
        }
      }
    },
    clean: {
      temp: ['temp']
    },
    copy: {
      sources: {
        files: [
          {expand: true, src: ['*'], cwd: 'temp', dest: 'dist/'},
        ]
      },
      jqLiteExtrasFake: {
        files: [
          {expand: true, src: ['ui-scroll-jqlite.js'], cwd: 'src', dest: 'dist/'},
          {
            expand: true, src: ['ui-scroll-jqlite.js'], cwd: 'src', dest: 'dist/', rename: function (dest, src) {
            return dest + src.replace(/\.js$/, ".min.js");
          }
          }
        ]
      }
    },
    jshint: {
      sources: {
        files: {
          src: [
            './src/*.js',
            './src/modules/*.js'
          ]
        },
        options: grunt.util._.extend({}, grunt.file.readJSON('.jshintrc'), grunt.file.readJSON('./src/.jshintrc'))
      },
      tests: {
        files: {
          src: ['./test/*Spec.js']
        },
        options: grunt.util._.extend({}, grunt.file.readJSON('.jshintrc'), {
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
    }
  });

  grunt.registerTask('server', [
    'connect',
    'watch'
  ]);

  grunt.registerTask('default', [
    'webpack:default',
    'server'
  ]);

  grunt.registerTask('test', [
    'clean:temp',
    'webpack:default',
    'karma:default'
  ]);

  grunt.registerTask('build', [
    'jshint:tests',
    'jshint:sources',
    'clean:temp',
    'webpack:compressed',
    'karma:compressed',
    'webpack:default',
    'copy:sources',
    'copy:jqLiteExtrasFake'
  ]);

  grunt.registerTask('travis', [
    'webpack:compressed',
    'karma:compressed'
  ]);
};
