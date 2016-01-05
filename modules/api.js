// $dd.api:
//		Basic structure for normalizing ajax calls across xhr,activexobject,jsonp,and cors
//		There's a basic $dd.api.raw function that sends data to a url via a method, and
//		executes the callback on success.
//		There's also the $dd.api.route function which takes a route name and links it
//		to a url with pre and post processing functions. If the pre processing function
//		doesn't return true, the call isn't sent. If the post processing function doesn't
//		return true, the callback isn't called.
//		This is more of a heap of code to stick into your own api interface.
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd'], factory);
	} else {
		factory($dd);
	}
})(function(lib){
	// processes an object into a querystring that can be passed to the server
	function postString(obj, prefix){
		var str = [], p, k, v;
		if(lib.type(obj, 'array')){
			if(!prefix){
				throw new Error('Sorry buddy, your object is wrong and you should feel bad');
			}

			for(p = 0; p < obj.length; p++){
				k = prefix + "[]";
				v = obj[p];
				str.push(typeof v === "object"?postString(v,k):encodeURIComponent(k) +
					"=" + encodeURIComponent(v));
			}
		} else {
			for(p in obj) {
				if(prefix){
					k = prefix + "[" + p + "]";
				} else {
					k = p;
				}
				v = obj[p];
				str.push(typeof v === "object"?postString(v,k):encodeURIComponent(k) +
					"=" + encodeURIComponent(v));
			}
		}
		return str.join("&");
	}

	// generates a topic for the mock url resolver to use
	function generate_topic(topic){
		var ret = {
			topic: topic,
			path: '',
			regexp: null,
			keys: [],
			methods: {}
		};

		ret.path = '^' + topic
			.replace(/\?/g, '\\?')
			.replace(/\/\(/g, '(?:/')
			.replace(
				/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g,
				function(_, slash, format, key, capture, optional){ // jshint ignore:line
					ret.keys.push({ name: key, optional: !! optional });
					slash = slash || '';
					return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') +
						(format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) +
						')' + (optional || '');
				}
			)
			.replace(/([\/.])/g, '\\$1')
			.replace(/\*/g, '(.*)') + '$';

		ret.regexp = new RegExp(ret.path);

		return ret;
	}

	// slices variables out of the url and joins it with the data sent
	// to the ajax call
	function clean_path_args(path,descriptor,args){
		var path_args = descriptor.regexp.exec(path).slice(1) || [],
			ni,no;

		// clean the numbers up
		for(ni = 0; ni < path_args.length; ni++){
			no = parseFloat(path_args[ni]);
			if(!isNaN(no)){
				path_args[ni] = no;
			}
		}

		return path_args.concat(args||[]);
	}

	function create_async_callback(callback, args, params){
		args.push(function(status, responseText){
			if(params.type === 'json'){
				try {
					responseText = JSON.parse(responseText);
				} catch(e) {}
			}

			if(status === 200 && lib.type(params.success, 'function')){
				params.success(responseText);
			} else if(status !== 200 && lib.type(params.error, 'function')){
				params.error(responseText);
			}
		});

		setTimeout(function(){
			callback.apply(lib, args)
		}, 0);
	}

	// creates an xhr object, real or imaginary
	function xhr(options){
		var origin, parts, crossDomain, _ret;
		function createStandardXHR(){ try { return new window.XMLHttpRequest(); } catch(e){} }
		function createActiveXHR(){ try { return new window.ActiveXObject("Microsoft.XMLHTTP"); } catch(e){} }
		function createJSONP(){
			function randomer(){
				var s=[],itoh = '0123456789ABCDEF',i;

				for(i = 0; i < 16; i++){
					s[i] = i===12?4:Math.floor(Math.random()*0x10);
					if(i===16){
						s[i] = (s[i]&0x3)|0x8;
					}
					s[i] = itoh[s[i]];
				}
				return s.join('');
			}

			var ret = {
				_jsonp: true,
				_options: {
					key: '',
					url: '',
					script: null,
					mime: 'json'
				},
				readyState: 0,
				onreadystatechange: null,
				response: null,
				responseText: null,
				responseXML: null,
				responseType: '',

				status: null,
				statusText: '',
				timeout: 0,

				upload: null
			};

			ret.abort = function(){
				if(ret.readyState !== 3){
					return;
				}
				ret._options.script.parentNode.removeChild(ret._options.script);
				lib.api[ret._options.key] = function(){
					delete lib.api[ret._options.key];
				};

				ret.readyState = 1;
				if(typeof ret.onreadystatechange === 'function'){
					ret.onreadystatechange();
				}
			};
			ret.getAllResponseHeaders = function(){};
			ret.getResponseHeader = function(){};
			ret.open = function(method,url,async,user,password){	// jshint ignore:line
				//method is always get, async is always true, and user/pass do nothing
				//they're still there to provide a consistant interface
				ret._options.url = url;
				ret._options.script = document.createElement('script');
				ret._options.script.type = 'text/javascript';
				ret.readyState = 1;
				if(typeof ret.onreadystatechange === 'function'){
					ret.onreadystatechange();
				}

				document.head.appendChild(ret._options.script);
			};
			ret.overrideMimeType = function(){};
			ret.send = function(){
				ret._options.key = 'jsonp_'+randomer();

				var url = ret._options.url;
				url += (url.indexOf('?') === -1?'?':'&');
				url += 'callback=$dd.api.'+ret._options.key;

				lib.api[ret._options.key] = function(data){
					if(!lib.type(data,'string')){
						data = JSON.stringify(data);
					}
					ret.responseText = data;
					ret.response = data;
					ret.readyState = 4;
					ret.status = 200;
					if(typeof ret.onreadystatechange === 'function'){
						ret.onreadystatechange();
					}
					ret._options.script.parentNode.removeChild(ret._options.script);

					delete lib.api[ret._options.key];
				};
				ret.readyState = 3;
				if(typeof ret.onreadystatechange === 'function'){
					ret.onreadystatechange();
				}
				ret._options.script.src = url;
			};

			ret.setRequestHeader = function(){};

			return ret;
		}

		try {
			origin = location.href;
		} catch(e){
			origin = document.createElement( "a" );
			origin.href = "";
			origin = origin.href;
		}

		origin = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/.exec(origin.toLowerCase());
		options.url = (( options.url ) + "").replace(/#.*$/, "").replace(/^\/\//, origin[1] + "//");
		parts  = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/.exec(options.url.toLowerCase())||[];

		if(!parts.length){
			parts = origin.slice(0);
			options.url = parts[0] + (options.url[0]=='/'?'':'/') + options.url;
		}
		if(parts.length < 3){
			throw new Error('$dd.api: invalid url supplied to xhr');
		}

		origin[3] = origin[3]||(origin[1]==='http:'?'80':'443');
		parts[3] = parts[3]||(parts[1]==='http:'?'80':'443');

		crossDomain = !!(parts &&
			( parts[1] !== origin[1] ||
				parts[2] !== origin[2] ||
				parts[3] !== origin[3]
			)
		);

		_ret = window.ActiveXObject ?
			function() {
				return !/^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(origin[1]) && createStandardXHR() || createActiveXHR();
			} : createStandardXHR;
		_ret = _ret();

		if(!_ret || (crossDomain && typeof _ret.withCredentials === 'undefined')){
			_ret = createJSONP();
		}

		return _ret;
	}

	var self = function(params){
		params = lib.extend({
			url: '',
			method: 'GET',
			type: 'json',
			async: 'true',
			timeout: 0,
			data: null,

			succes: null,
			error: null
		},params);

		params.method = params.method.toUpperCase();

		var topic = params.url,
			ni, t, _xhr,
			path_args;

		for(t in _mocks){
			if(!_mocks[t].regexp.test(topic)){
				continue;
			}
			if(!_mocks[t].methods.hasOwnProperty(params.method)){
				continue;
			}

			path_args = clean_path_args(topic, _mocks[t], params.data);

			create_async_callback(_mocks[t].methods[params.method], path_args, params);
			return;
		}

		// didn't need to mock it, let's do it for real
		_xhr = xhr(params);

		if(_xhr.hasOwnProperty('_jsonp')){
			params.method = 'GET';
		}

		if(params.method === 'GET'){
			params.url += (params.url.indexOf('?') ? '?' : '&') +
				postString(params.data);
		}

		_xhr.open(params.method, params.url, params.async);
		_xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		_xhr.responseType = params.type;
		_xhr.onreadystatechange = function(){
			if(_xhr.readyState !== 4){
				return;
			}
			if(_xhr.status !== 200 && typeof params.error === 'function'){
				params.error(_xhr.response);
			}
			if(_xhr.status === 200 && typeof params.success === 'function'){
				params.success(_xhr.response);
			}
		};

		for(ni = 0; ni < _before.length; ni++){
			_before[ni](_xhr);
		}

		_xhr.send(params.method==='POST' ? postString(params.data) : null);

		return _xhr;
	},
	_before = [],
	_mocks = {};

	// $dd.api.before registers a function that is called before every
	// ajax request, being passed the current xhr object
	self.before = function(callback){
		if(!lib.type(callback, 'function')){
			return;
		}

		_before.push(callback);
	};

	// $dd.api.mock uses the same string functions as the pubsub module
	// to match a url and intercept a request coming through $dd.api()
	// allowing you to write network code without having an api endpoint
	// the callback function takes three parameters:
	//		callback(url, data, cb)
	// where url is an array of parameters parsed from the url,
	// data is the data sent to the ajax call, and cb is a callback
	// function for the completion of the mock call. cb takes two
	// parameters:
	//		cb(statusCode, responseText)
	self.mock = function(params){
		if(!params.hasOwnProperty('url')){
			console.log('$dd.api.mock called without url parameter');
			return;
		}

		params = lib.extend({
			method: 'GET',
			callback: function(){}
		}, params);
		params.method = params.method.toUpperCase();

		if(!lib.type(params.callback, 'function')){
			return;
		}

		topic = generate_topic(params.url);
		if(!_mocks.hasOwnProperty(topic.path)){
			_mocks[topic.path] = topic;
		}
		if(_mocks[topic.path].methods.hasOwnProperty(params.method)){
			console.log('$dd.api.mock: overwritting mock with ' + params.url);
		}
		_mocks[topic.path].methods[params.method] = params.callback;
	};

	if (lib.api) {
		return;
	}

	lib.mixin({
		api : self
	});
});
