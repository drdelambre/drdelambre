/**\

	Toggle
		another one of those helper functions to create a togglable
		interface, because these are used a lot for all sorts of
		things.

\**/
function toggle(on_open, on_close) {
	var ret = function() {
		if (ret.isOpen) {
			return ret.close();
		}

		return ret.open();
	};

	ret.isOpen = false;

	ret.open = function() {
		if (ret.isOpen) {
			return ret;
		}

		ret.isOpen = true;

		if (typeof on_open === 'function') {
			on_open();
		}

		return ret;
	};

	ret.close = function() {
		if (!ret.isOpen) {
			return ret;
		}

		ret.isOpen = false;

		if (typeof on_close === 'function') {
			on_close();
		}

		return ret;
	};

	return ret;
}

export default toggle;
