/**\

	Keys
		Why not add some hotkey bindings? This one is super cool
		and allows for all sorts of crazy combinations. The basic
		syntax is:
			[hold this][press this]
				and
			this1 + this2 + this3
		in any permutation you require
		caps lock konami code:
			[shift][up + up + down + down + left + \
				right + left + right + b + a + enter]

\**/
const DELAY = 500;

var keyStatus = {},
	keyMap = {};

function add(evt) {
	/* istanbul ignore next: Browser specific */
	var code = evt.key ? evt.key : evt.which ? evt.which : event.keyCode,
		ni;

	keyStatus[code] = true;

	for (ni in keyMap) {
		keyMap[ni].check(code);
	}
}

function remove(evt) {
	/* istanbul ignore next: Browser specific */
	var code = evt.key ? evt.key : evt.which ? evt.which : event.keyCode;

	delete keyStatus[code];
}

function translate(str) {
	var _str = str.toLowerCase();

	if (/(ctrl|alt|shift|tab|enter|left|right|up|down|space)/.test(_str)) {
		/* istanbul ignore next: Not all of these should be tested */
		switch (str) {
			case 'ctrl': return 17;
			case 'alt': return 18;
			case 'shift': return 16;
			case 'tab': return 9;
			case 'enter': return 13;
			case 'left': return 37;
			case 'right': return 39;
			case 'up': return 38;
			case 'down': return 40;
			case 'esc': return 27;
			case 'space': return 32;
			default: break;
		}
	}

	return _str.toUpperCase().charCodeAt(0);
}

/* istanbul ignore else: Browser specific */
if (window.addEventListener) {
	window.addEventListener('keydown', add, false);
	window.addEventListener('keyup', remove, false);
} else {
	window.attachEvent('keydown', add);
	window.attachEvent('keyup', remove);
}

class Sequence {
	constructor(str, callback) {
		var split_by_modifier = /(\[(.*?)\]\w*\[(.*?)\])/g.exec(str),
			modifiers, result;

		if (split_by_modifier) {
			modifiers = split_by_modifier[2];
			result = split_by_modifier[3];
		} else {
			modifiers = '';
			result = str;
		}

		modifiers = modifiers.split('+')
			.filter(function(val) {
				return !!(val);
			})
			.map(function(val) {
				return translate(val.trim());
			});

		result = result.split('+')
			.filter(function(val) {
				return !!(val);
			})
			.map(function(val) {
				return translate(val.trim());
			});

		this.pointer = 0;
		this.callback = callback;

		this.seq = result.map(function(val) {
			return {
				key: val,
				state: modifiers
			};
		});
	}

	check(key) {
		var curr = this.seq[this.pointer],
			_key = key,
			ni, valid, init;

		//normalize numpad
		if (_key > 95 && _key < 106) {
			_key -= 48;
		}

		if (curr.state) {
			valid = true;
			init = false;

			for (ni = 0; ni < curr.state.length; ni++) {
				if (curr.state[ni] === _key) {
					init = true;
				}

				valid = valid && keyStatus[curr.state[ni]];
			}

			//a modifier must be pressed before being applied
			if (init) {
				this.reset();
				return;
			}

			if (!valid || _key !== curr.key) {
				this.clear();
				return;
			}
		} else if (_key !== curr.key) {
			this.clear();
			return;
		}

		if (this.pointer < this.seq.length - 1) {
			this.pointer++;
			this.reset();
			return;
		}

		if (typeof this.callback === 'function') {
			this.callback();
		}

		this.clear();

		return true;
	}

	reset() {
		if (this._inter) {
			clearTimeout(this._inter);
		}

		this._inter = setTimeout(this.clear.bind(this), DELAY);

		return;
	}

	clear() {
		if (this._inter) {
			clearTimeout(this._inter);
			this._inter = null;
		}

		this.pointer = 0;

		return;
	}
}

export default function Keys(map) {
	var ni;

	if (this instanceof Keys) {
		throw new Error(
			'Keys: This modules is set up as a service, ' +
			'remove the `new` keyword');
	}

	for (ni in map) {
		keyMap[ni] = new Sequence(ni, map[ni]);
	}
}
