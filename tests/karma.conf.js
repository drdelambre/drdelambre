var webpack = require('webpack'),
	path = require('path');

module.exports = function(config) {
	config.set({
		basePath: '',
		files: [
			'./**/*.js',
			{
				pattern: 'data/*.json',
				watched: false,
				included: false,
				served: true
			}
		],

		preprocessors: {
			'./**/*.js': [ 'webpack' ]
		},

		frameworks: ['phantomjs-shim', 'mocha', 'chai', 'sinon'],

		webpack: {
			resolve: {
				extensions: ['', '.js', '.less', '.jsx'],
				alias: {
					'base': path.join(__dirname, '../lib')
				}
			},
			devtool: 'inline-source-map',
			node: {
				fs: 'empty'
			},
			module: {
				loaders: [{
					test: /\.(js|jsx)$/,
					exclude: /(node_modules|conf\.js)/,
					loaders: ['babel-loader?stage=0&optional[]=runtime']
				}],
				postLoaders: [{
					test: /\.(js|jsx)$/,
					exclude: /(shims|tests|node_modules)\//,
					loader: 'istanbul-instrumenter'
				}]
			}
		},

		webpackMiddleware: {
			noInfo: true
		},

		coverageReporter: {
			type: 'html',
			dir: 'coverage/',

			check: {
				each: {
					statements: 90,
					branches: 80,
					functions: 100
				}
			}
		},

		proxies: {
			'/beans': '/base/data/beans.json'
		},

		reporters: [ 'dots', 'coverage' ],
		port: 9876,
		colors: true,
		logLevel: config.LOG_ERROR,
		autoWatch: true,
		browsers: ['PhantomJS'],
		singleRun: true
	});
};
