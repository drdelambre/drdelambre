/**\

	Observer
		Easy constructor for setting up an observer pattern

\**/
function Observer() {
	var cache = [],
		ret = function(callback) {
			if (typeof callback !== 'function') {
				return;
			}

			cache.push(callback);
		};

	ret.fire = function(...params) {
		var ni;

		for (ni = 0; ni < cache.length; ni++) {
			cache[ni].apply(ret, params);
		}
	};

	ret.remove = function(callback) {
		var ni;

		for (ni = 0; ni < cache.length; ni++) {
			if (cache[ni] !== callback) {
				continue;
			}

			cache.splice(ni, 1);
			break;
		}
	};

	ret.clear = function() {
		cache = [];
	};

	return ret;
}

export default Observer;
