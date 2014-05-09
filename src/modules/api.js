/* {"requires": ["$dd"]} */
// $dd.api:
//		Basic structure for normalizing ajax calls across xhr,activexobject,jsonp,and cors
//		There's a basic $dd.api.raw function that sends data to a url via a method, and
//		executes the callback on success.
//		There's also the $dd.api.route function which takes a route name and links it
//		to a url with pre and post processing functions. If the pre processing function
//		doesn't return true, the call isn't sent. If the post processing function doesn't
//		return true, the callback isn't called.
//		This is more of a heap of code to stick into your own api interface.
;(function(lib){
	function postString(obj, prefix){
		var str = [], p, k, v;
		if(lib.type(obj,'array')){
			if(!prefix){
				throw new Error('Sorry buddy, your object is wrong and you should feel bad');
			}

			for(p = 0; p < obj.length; p++){
				k = prefix + "[" + p + "]";
				v = obj[p];
				str.push(typeof v === "object"?postString(v,k):encodeURIComponent(k) + "=" + encodeURIComponent(v));
			}
		}

		for(p in obj) {
			if(prefix){
				k = prefix + "[" + p + "]";
			} else {
				k = p;
			}
			v = obj[p];
			str.push(typeof v === "object"?postString(v,k):encodeURIComponent(k) + "=" + encodeURIComponent(v));
		}
		return str.join("&");
	}
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
		parts  = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/.exec(options.url.toLowerCase());

		if(!parts.length || parts.length < 3){
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

		if(!_ret || (crossDomain && !_ret.hasOwnProperty('withCredentials'))){
			_ret = createJSONP();
		}

		return _ret;
	}
	function ajax(params){
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

		var _xhr = xhr(params);
		if(_xhr.hasOwnProperty('_jsonp')){
			params.method = 'GET';
		}

		if(params.method === 'GET'){
			params.url += '?' + postString(params.data);
		}

		_xhr.open(params.method,params.url,params.async);
		_xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
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
		_xhr.send(params.method==='POST'?postString(params.data):null);
		return _xhr;
	}

	var self = {};

	self.raw = function(url,data,callback,method){
		return ajax({
			method: method||'GET',
			url: url,
			data: data,
			success: function(result){
				if(lib.type(callback,'function')){
					callback(result);
				}
			}
		});
	};

	// if you're going to be using pre and post filters on the data
	// make sure you return true to continue the chain, or return
	// false to cancel it
	self.route = function(name,url,pre,post,method){	// jshint ignore:line
		name = name.trim();
		pre = pre||function(){ return true; };
		post = post||function(){ return true; };

		if(/^(route|raw|config)$/.test(name)){
			throw new Error('invalid name sent to $dd.api.route');
		}

		self[name] = function(params,callback){
			if(!pre(params)){
				return;
			}

			self.raw(url,params,function(data){
				if(post(data) && lib.type(callback,'function')){
					callback(data);
				}
			},method||'GET');
		};
	};

	lib.mixin({
		api : self
	});
})($dd);
