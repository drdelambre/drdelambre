module.exports = function(grunt){
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			dd: {
				src: ['src/dd.js']
			},
			polyfill: {
				src: ['src/polyfill/**/*.js'],
				options: {
					freeze: false,
					predef: [ "$dd" ]
				}
			},
			modules: {
				src: ['src/modules/**/*.js','!src/modules/model.knockout.js'],
				options: {
					predef: [ "$dd" ]
				}
			},
			options: {
				curly: true,
				eqeqeq: true,
				forin: false,
				freeze: true,
				immed: true,
				indent: 4,
				latedef: true,
				noarg: true,
				nonbsp: true,
				plusplus: false,
				undef: true,
				unused: true,
				trailing: true,
				maxparams: 4,
				eqnull: true,
				browser: true,
				devel: false,
				phantom: true
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('lint',['jshint']);
};