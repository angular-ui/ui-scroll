// Build configurations.
module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    packageBower: grunt.file.readJSON('./bower.json'),
    timestamp: (new Date()).toISOString(),
    releaseData: '/*!\n' +
    ' * <%= packageBower.name %>\n' +
    ' * <%= packageBower.homepage %>\n' +
    ' * Version: <%= packageBower.version %> -- <%= timestamp %>\n' +
    ' * License: <%= packageBower.license %>\n' +
    ' */\n',
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
      unit: {
        options: {
          autoWatch: true,
          colors: true,
          configFile: './test/karma.conf.js',
          keepalive: true,
          port: 8082,
          runnerPort: 9100
        }
      },
      travis: {
        options: {
          colors: true,
          configFile: './test/karma.conf.js',
          runnerPort: 9100,
          singleRun: true
        }
      }
    },
    babel: {
      options: {
        //sourceMap: true,
        babelrc: false,
        presets: ['es2015']
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: ['**/*.js'],
            dest: 'temp/',
            ext: '.js'
          }
        ]
      }
    },
    concat: {
      options: {
        banner: '<%= releaseData %> \n\n (function () {\n',
        footer: '}());',
        stripBanners: true,
        process: function (src, filepath) {
          var singleQuotes, strings;
          console.log("Processing " + filepath + " ...");
          strings = /("(?:(?:\\")|[^"])*")/g;
          singleQuotes = /'/g;
          return src.replace(strings, function (match) {
            var result;
            console.log("match: " + match);
            result = "'" + match.substring(1, match.length - 1).replace(singleQuotes, "\\'") + "'";
            console.log("replaced with: " + result);
            return result;
          });
        }
      },
      dynamic_mappings: {
        files: {
          'dist/ui-scroll.js': ['./temp/**/ui-scroll.js'],
          'dist/ui-scroll-grid.js': ['./temp/**/ui-scroll-grid.js'],
          'dist/ui-scroll-jqlite.js': ['./temp/**/ui-scroll-jqlite.js']
        }
      }
    },
    uglify: {
      options: {
        banner: '<%= releaseData %>'
      },
      common: {
        files: {
          './dist/ui-scroll.min.js': ['./dist/ui-scroll.js'],
          './dist/ui-scroll-grid.min.js': ['./dist/ui-scroll-grid.js'],
          './dist/ui-scroll-jqlite.min.js': ['./dist/ui-scroll-jqlite.js']
        }
      }
    },
    jshint: {
      dist: {
        files: {
          src: [
            './dist/ui-scroll.js',
            './dist/ui-scroll-jqlite.js'
          ]
        },
        options: {
          jshintrc: '.jshintrc'
        }
      },
      src: {
        files: {
          src: [
            './src/ui-scroll.js',
            './src/ui-scroll-jqlite.js'
          ]
        },
        options: grunt.util._.extend({}, grunt.file.readJSON('.jshintrc'), grunt.file.readJSON('./src/.jshintrc'))
      },
      test: {
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
    'babel',
    'karma:unit'
  ]);

  grunt.registerTask('buildWatcher', [
    'babel',
    'concat'
  ]);

  grunt.registerTask('build', [
    'jshint:test',
    'jshint:src',
    'babel',
    'karma:travis',
    'concat',
    'uglify:common'
  ]);

  grunt.registerTask('travis', [
    'babel',
    'karma:travis'
  ]);
};
