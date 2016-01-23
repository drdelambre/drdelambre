import { type } from '../util';

export default function createJSONP() {
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

	function randomer() {
		var s = [],
			itoh = '0123456789ABCDEF',
			i;

		for (i = 0; i < 16; i++) {
			s[i] = i === 12 ? 4 : Math.floor(Math.random() * 0x10);

			if (i === 15) {
				s[i] = (s[i] & 0x3) | 0x8;
			}

			s[i] = itoh[s[i]];
		}

		return s.join('');
	}

	ret.abort = function() {
		if (ret.readyState !== 3) {
			return;
		}

		ret._options.script.parentNode.removeChild(ret._options.script);
		delete ret._options.script;

		window._ajaxCallbacks[ret._options.key] = function() {
			delete window._ajaxCallbacks[ret._options.key];
		};

		ret.readyState = 1;

		/* istanbul ignore else */
		if (type(ret.onreadystatechange, 'function')) {
			ret.onreadystatechange();
		}
	};

	ret.getAllResponseHeaders = function() {};
	ret.getResponseHeader = function() {};

	ret.open = function(method, url) {
		ret._options.url = url;
		ret._options.script = document.createElement('script');
		ret._options.script.type = 'text/javascript';
		ret._options.script.onerror = function() {
			ret.clean();

			ret.readyState = 4;
			ret.status = 404;

			/* istanbul ignore else */
			if (type(ret.onreadystatechange, 'function')) {
				ret.onreadystatechange();
			}
		};

		if (type(window._ajaxCallbacks, 'undefined')) {
			window._ajaxCallbacks = {};
		}

		do {
			ret._options.key = 'jsonp_' + randomer();
		} while (ret._options.key in window._ajaxCallbacks)

		ret.readyState = 1;

		if (type(ret.onreadystatechange, 'function')) {
			ret.onreadystatechange();
		}

		document.head.appendChild(ret._options.script);
	};

	ret.overrideMimeType = function() {};

	ret.send = function() {
		var url = ret._options.url;

		url += (url.indexOf('?') === -1 ? '?' : '&');
		url += 'callback=window._ajaxCallbacks.' + ret._options.key;

		window._ajaxCallbacks[ret._options.key] = function(data) {
			var _data = (
				type(data, 'string') ? JSON.parse(data) : data);

			ret.responseText = _data;
			ret.response = _data;
			ret.readyState = 4;
			ret.status = 200;

			ret.clean();

			/* istanbul ignore else */
			if (type(ret.onreadystatechange, 'function')) {
				ret.onreadystatechange();
			}
		};

		ret.readyState = 3;

		/* istanbul ignore else */
		if (type(ret.onreadystatechange, 'function')) {
			ret.onreadystatechange();
		}

		ret._options.script.src = url;
	};

	ret.clean = function() {
		ret._options.script
			.parentNode.removeChild(ret._options.script);

		delete ret._options.script;
		delete window._ajaxCallbacks[ret._options.key];
	};

	ret.setRequestHeader = function() {};

	return ret;
}
