// Build configurations.
module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-webpack');

  grunt.initConfig({
    connect: {
      app: {
        options: {
          base: './',
          middleware: require('./server/middleware'),
          port: 5001
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
        tasks: 'buildWatcher'
      }
    },
    karma: {
      dev: {
        options: {
          autoWatch: true,
          colors: true,
          configFile: './test/karma.conf.js',
          keepalive: true,
          port: 8082,
          runnerPort: 9100
        }
      },
      prod: {
        options: {
          colors: true,
          configFile: './test/karma.conf.js',
          runnerPort: 9100,
          singleRun: true
        }
      }
    },
    webpack: {
      options: require("./webpack.config.js").config,
      prod: {
        cache: false,
        plugins: require("./webpack.config.js").prodPlugins
      },
      dev: {
        cache: false
      }
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

  /**
   * Starts a web server
   * Enter the following command at the command line to execute this task:
   * grunt server
   */
  grunt.registerTask('server', [
    'connect',
    'watch'
  ]);

  grunt.registerTask('default', ['server']);

  grunt.registerTask('test', [
    'webpack:dev',
    'karma:dev'
  ]);

  grunt.registerTask('buildWatcher', [
    'jshint:sources',
    'webpack:dev'
  ]);

  grunt.registerTask('build', [
    'jshint:tests',
    'jshint:sources',
    'webpack:prod',
    'karma:prod',
    'copy:sources',
    'copy:jqLiteExtrasFake'
  ]);

  grunt.registerTask('travis', [
    'webpack:prod',
    'karma:prod'
  ]);
};
