import { extend, generate_topic } from './util.js';
import setImmediate from './shims/setImmediate.js';
import createJSONP from './internal/jsonp.js';

// $dd.api:
//      Basic structure for normalizing ajax calls across
//      xhr,activexobject,jsonp,and cors
//      There's a basic $dd.api.raw function that sends data to a
//      url via a method, and executes the callback on success.
//      There's also the $dd.api.route function which takes a route name
//      and links it to a url with pre and post processing functions.
//      If the pre processing function doesn't return true, the call
//      isn't sent. If the post processing function doesn't return true,
//      the callback isn't called. This is more of a heap of code to
//      stick into your own api interface.

var _before = [],
	_mocks = {};

// processes an object into a querystring that can be passed to the server
function postString(obj, prefix) {
	var str = [], p, k, v;

	if (Object.prototype.toString.call(obj) === '[object Array]') {
		if (!prefix) {
			throw new Error(
				'Sorry buddy, your object is wrong' +
				'and you should feel bad');
		}

		for (p = 0; p < obj.length; p++) {
			k = prefix + '[]';
			v = obj[p];
			str.push(typeof v === 'object' ? postString(v, k) :
				encodeURIComponent(k) + '=' + encodeURIComponent(v));
		}
	} else {
		for (p in obj) {
			if (prefix) {
				k = prefix + '[' + p + ']';
			} else {
				k = p;
			}

			v = obj[p];
			str.push(typeof v === 'object' ? postString(v, k) :
				encodeURIComponent(k) + '=' + encodeURIComponent(v));
		}
	}

	return str.join('&');
}

// slices variables out of the url and joins it with the data sent
// to the ajax call
function clean_path_args(path, descriptor, args) {
	var path_args = descriptor.regexp.exec(path).slice(1),
		ni, no;

	// clean the numbers up
	for (ni = 0; ni < path_args.length; ni++) {
		no = parseFloat(path_args[ni]);
		if (!isNaN(no)) {
			path_args[ni] = no;
		}
	}

	return path_args.concat(args);
}

function create_async_callback(callback, args, params) {
	args.push(function(status, responseText) {
		var response = responseText;

		/* istanbul ignore else: only handle strings and json here */
		if (params.type === 'json') {
			try {
				response = JSON.parse(response);
			} catch (e) {
				response = response;
			}
		}

		if (status === 200 && typeof params.success === 'function') {
			params.success(response);
		/* istanbul ignore else */
		} else if (status !== 200 && typeof params.error === 'function') {
			params.error(response);
		}
	});

	setImmediate(function() {
		callback.apply(callback, args);
	});
}

// creates an xhr object, real or imaginary
function xhr(options) {
	var origin, parts, crossDomain, _ret;

	function createStandardXHR() {
		/* istanbul ignore next: Always works in PhantomJS */
		try {
			return new window.XMLHttpRequest();
		} catch (e) {
			return;
		}
	}

	/* istanbul ignore next: Never gets fired in PhantomJS */
	function createActiveXHR() {
		try {
			return new window.ActiveXObject('Microsoft.XMLHTTP');
		} catch (e) {
			return;
		}
	}

	/* istanbul ignore next: Cant overwrite location in PhantomJS */
	try {
		origin = location.href;
	} catch (e) {
		origin = document.createElement('a');
		origin.href = '';
		origin = origin.href;
	}

	origin = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/
		.exec(origin.toLowerCase());
	options.url = (options.url + '')
		.replace(/#.*$/, '')
		.replace(/^\/\//, origin[1] + '//');
	parts = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/
		.exec(options.url.toLowerCase()) || [];

	/* istanbul ignore else */
	if (!parts.length) {
		parts = origin.slice(0);
		options.url = parts[0] +
			(options.url[0] === '/' ? '' : '/') +
			options.url;
	}

	/* istanbul ignore next: Doesn't happen... usually */
	if (parts.length < 3) {
		throw new Error('Ajax: invalid url supplied to xhr');
	}

	origin[3] = origin[3] || (origin[1] === 'http:' ? '80' : '443');
	parts[3] = parts[3] || (parts[1] === 'http:' ? '80' : '443');

	crossDomain = !!(parts &&
		(parts[1] !== origin[1] ||
			parts[2] !== origin[2] ||
			parts[3] !== origin[3])
	);

	/* istanbul ignore next: IE fixes dont fire in PhantomJS */
	_ret = window.ActiveXObject ?
		function() {
			return !/^(?:about|app|app-storage|.+-extension|file|res|widget):$/
				.test(origin[1]) && createStandardXHR() || createActiveXHR();
		} : createStandardXHR;
	_ret = _ret();

	/* istanbul ignore next: jsonp is too crazy */
	if (!_ret || (crossDomain &&
		typeof _ret.withCredentials === 'undefined') ||
		options.type === 'jsonp') {
		_ret = createJSONP();
	}

	return _ret;
}

function Ajax(params) {
	var _params = extend({
			url: '',
			method: 'GET',
			type: 'json',
			async: 'true',
			timeout: 0,
			data: null,

			succes: null,
			error: null
		}, params),
		topic = _params.url,
		ni, t, _xhr,
		path_args;

	_params.method = _params.method.toUpperCase();

	for (t in _mocks) {
		if (!_mocks[t].regexp.test(topic)) {
			continue;
		}

		if (!_mocks[t].methods.hasOwnProperty(params.method)) {
			continue;
		}

		path_args = clean_path_args(topic, _mocks[t], _params.data);

		create_async_callback(
			_mocks[t].methods[params.method],
			path_args,
			_params
		);

		return;
	}

	_xhr = xhr(_params);

	/* istanbul ignore if: jsonp is too crazy */
	if (_xhr.hasOwnProperty('_jsonp')) {
		_params.method = 'GET';
	}

	/* istanbul ignore else: POST will do its own thing */
	if (_params.method === 'GET') {
		_params.url += (_params.url.indexOf('?') === -1 ? '?' : '&') +
			postString(_params.data);
	}

	_xhr.open(_params.method, _params.url, _params.async);
	_xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	_xhr.responseType = _params.type;
	_xhr.onreadystatechange = function() {
		if (_xhr.readyState !== 4) {
			return;
		}
		if (_xhr.status !== 200 && typeof _params.error === 'function') {
			_params.error(_xhr.response);
		}
		if (_xhr.status === 200 && typeof _params.success === 'function') {
			_params.success(_xhr.response);
		}
	};

	for (ni = 0; ni < _before.length; ni++) {
		_before[ni](_xhr);
	}

	_xhr.send(_params.method === 'POST' ? postString(_params.data) : null);

	return _xhr;
}

// $dd.api.before registers a function that is called before every
// ajax request, being passed the current xhr object
Ajax.before = function(callback) {
	if (typeof callback !== 'function') {
		return;
	}

	_before.push(callback);
};

// $dd.api.mock uses the same string functions as the pubsub module
// to match a url and intercept a request coming through $dd.api()
// allowing you to write network code without having an api endpoint
// the callback function takes three parameters:
//      callback(url, data, cb)
// where url is an array of parameters parsed from the url,
// data is the data sent to the ajax call, and cb is a callback
// function for the completion of the mock call. cb takes two
// parameters:
//      cb(statusCode, responseText)
Ajax.mock = function(params) {
	var _params, topic;

	if (!params.hasOwnProperty('url')) {
		throw new Error('Ajax.mock called without url parameter');
	}

	_params = extend({
		method: 'GET'
	}, params);

	_params.method = _params.method.toUpperCase();

	if (typeof _params.callback !== 'function') {
		return;
	}

	topic = generate_topic(_params.url);

	if (!_mocks.hasOwnProperty(topic.path)) {
		_mocks[topic.path] = topic;
		_mocks[topic.path].methods = {};
	}

	if (_mocks[topic.path].methods.hasOwnProperty(_params.method)) {
		throw new Error('Ajax.mock: overwritting mock with ' + _params.url);
	}

	_mocks[topic.path].methods[_params.method] = _params.callback;
};

Ajax.clear_mocks = function() {
	_mocks = {};
};

export default Ajax;
