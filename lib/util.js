// $dd.init:
//		Stores up function calls until the document.ready
//		then blasts them all out
var init = (function() {
	var c = [],
		loaded = false,
		onload, ni;

	/* istanbul ignore else */
	if (typeof window !== 'undefined' &&
		typeof window.document !== 'undefined') {
		/* istanbul ignore else */
		if (document.addEventListener) {
			onload = function() {
				document.removeEventListener('DOMContentLoaded', onload, false);
				loaded = true;

				// PhantomJS injects our code after the document is ready
				/* istanbul ignore next */
				for (ni = 0; ni < c.length; ni++) {
					c[ni]();
				}
			};

			document.addEventListener('DOMContentLoaded', onload, false);
		} else if (document.attachEvent) {
			onload = function() {
				if (document.readyState === 'complete') {
					document.detachEvent('onreadystatechange', onload);
					loaded = true;
					for (ni = 0; ni < c.length; ni++) {
						c[ni]();
					}
				}
			};

			document.attachEvent('onreadystatechange', onload);
		}
	} else {
		loaded = true;
	}

	return function(_f) {
		// PhantomJS injects our code after the document is ready
		/* istanbul ignore else */
		if (loaded) {
			_f();
		} else {
			c.push(_f);
		}
	};
})();

export { init };

// $dd.type:
//		lets shrink some code. Calling without the type variable
//		just returns the type, calling it with returns a boolean
//		you can pass a comma seperated list of types to match against
export function type(variable, type_str) {
	var t = typeof variable,
		trap = false,
		more, split;

	// Addresses a PhantomJS bug that turns a null variable into 'window'
	// https://github.com/ariya/phantomjs/issues/13617
	if (arguments.length &&
		typeof arguments[0] === 'object' &&
		!arguments[0]) {
		t = 'null';
	}

	if (t === 'object') {
		more = Object.prototype.toString.call(variable);

		if (more === '[object Array]') {
			t = 'array';
		/* istanbul ignore if */
		} else if (more === '[object Null]') {
			t = 'null';
		} else if (more === '[object Date]') {
			t = 'date';
		} else if (more === '[object DOMWindow]' ||
				more === '[object Window]' ||
				more === '[object global]') {
			t = 'node';
		} else if (variable.nodeType) {
			if (variable.nodeType === 1) {
				t = 'node';
			} else {
				t = 'textnode';
			}
		}
	}

	if (!type_str) {
		return t;
	}

	split = type_str.split(',');
	for (more = 0; more < split.length; more++) {
		trap = trap || (split[more].trim() === t);
	}

	return trap;
}

// $dd.extend:
//		throw a bunch of objects in and it smashes
//		them together from right to left
//		returns a new object
export function extend(...args) {
	var out = {},
		ni, no;

	if (!args.length) {
		throw new Error('extend called with too few parameters');
	}

	for (ni = 0; ni < args.length; ni++) {
		if (!type(args[ni], 'object')) {
			continue;
		}

		for (no in args[ni]) {
			out[no] = args[ni][no];
		}
	}

	return out;
}

// $dd.generate_topic
//		generic route dsl object for turning strings like
//			'/beans/:id/goto'
//		into regular expressions for route mapping
export function generate_topic(topic) {
	var ret = {
		topic: topic,
		path: '',
		regexp: null,
		keys: [],
		subs: []
	};

	ret.path = '^' + topic
		.replace(/\/\(/g, '(?:/')
		.replace(
			/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g,
			function(_, slash, format, key, capture, optional) {
				ret.keys.push({ name: key, optional: !!optional });

				return '' + (optional ? '' : slash) +
					'(?:' + (optional ? slash : '') +
					(format || '') +
					/* istanbul ignore next */
					(capture || (format && '([^/.]+?)' || '([^/]+?)')) +
					')' + (optional || '');
			}
		)
		.replace(/([\/.])/g, '\\$1')
		.replace(/\*/g, '(.*)') + '$';

	ret.regexp = new RegExp(ret.path);

	return ret;
}

// processes an object into a querystring that can be passed to the server
export function post_string(obj, prefix) {
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
			str.push(typeof v === 'object' ? post_string(v, k) :
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
			str.push(typeof v === 'object' ? post_string(v, k) :
				encodeURIComponent(k) + '=' + encodeURIComponent(v));
		}
	}

	return str.join('&');
}


