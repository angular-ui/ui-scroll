# Build configurations.
module.exports = (grunt) ->

	grunt.loadNpmTasks 'grunt-karma'
	grunt.loadNpmTasks 'grunt-contrib-connect'
	grunt.loadNpmTasks 'grunt-contrib-watch'
	grunt.loadNpmTasks 'grunt-contrib-coffee'
	grunt.loadNpmTasks 'grunt-contrib-jshint'
	grunt.loadNpmTasks 'grunt-contrib-concat'
	grunt.loadNpmTasks 'grunt-contrib-uglify'

	grunt.initConfig
		packageBower: grunt.file.readJSON('./bower.json')
		timestamp: (new Date()).toISOString()
		releaseData:
			'/*!\n' +
			' * <%= packageBower.name %>\n' +
			' * <%= packageBower.homepage %>\n' +
			' * Version: <%= packageBower.version %> -- <%= timestamp %>\n' +
			' * License: <%= packageBower.license %>\n' +
			' */\n'
		connect:
			app:
				options:
					base: './'
					middleware: require './server/middleware'
					port: 5001
		watch:
			options:
				livereload: false
		karma:
			unit:
				options:
					autoWatch: true
					colors: true
					configFile: './test/karma.conf.js'
					keepalive: true
					port: 8081
					runnerPort: 9100
			travis:
				options:
					colors: true
					configFile: './test/karma.conf.js'
					runnerPort: 9100
					singleRun: true

		# transpile CoffeeScript (.coffee) files to JavaScript (.js).
		coffee:
			build:
				files: [
					cwd: './src'
					src: '*.coffee'
					dest: './temp/'
					expand: true
					ext: '.js'
				]
				options:
					bare: true
					#sourceMap: true

		concat:
			options:
				#prepend 'use strict' and release data to the files
				banner:
					'<%= releaseData %> \n\n (function () {\n\'use strict\';\n'
				footer: '}());'
				stripBanners: true
				process: (src, filepath) ->
					console.log("Processing #{filepath} ...")

					strings = /("(?:(?:\\")|[^"])*")/g
					singleQuotes = /'/g

					src.replace(strings,
						(match) ->
							console.log("match: " + match)
							result = "'" + match.substring(1, match.length-1).replace(singleQuotes, "\\'") + "'"
							console.log "replaced with: " + result
							result
					)

			dynamic_mappings:
				files:
					'dist/ui-scroll.js': ['./temp/**/ui-scroll.js']
					'dist/ui-scroll-jqlite.js': ['./temp/**/ui-scroll-jqlite.js']

		uglify:
			options:
				banner: '<%= releaseData %>'
			common:
				files:
					'./dist/ui-scroll.min.js': [
						'./dist/ui-scroll.js'
					]
					'./dist/ui-scroll-jqlite.min.js': [
						'./dist/ui-scroll-jqlite.js'
					]

		# run the linter
		jshint:
			dist:
				files:
					src: ['./dist/ui-scroll.js', './dist/ui-scroll-jqlite.js']
				options: jshintrc: '.jshintrc'
			test:
				files:
					src : [ './test/*Spec.js']
				options: grunt.util._.extend({}, grunt.file.readJSON('.jshintrc'), {
					node: true
					globals: 
						angular: false
						inject: false
						jQuery: false
						jasmine: false
						afterEach: false
						beforeEach: false
						ddescribe: false
						describe: false
						expect: false
						iit: false
						it: false
						spyOn: false
						xdescribe: false
						xit: false
				})					

		# Starts a web server
		# Enter the following command at the command line to execute this task:
		# grunt server
		grunt.registerTask 'server', [
			'connect'
			'watch'
		]

	grunt.registerTask 'default', ['server']

	grunt.registerTask 'test', [
		'karma:unit'
	]

	grunt.registerTask 'build', [
		'jshint:test'
		'karma:travis'
		'coffee:build'
		'concat'
		'jshint:dist'
		'uglify:common']

	grunt.registerTask 'travis', [
		'karma:travis'
	]