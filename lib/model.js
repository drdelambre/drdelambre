import { type } from './util.js';
import ThrottledObserver from './throttled-observer.js';
import MagicArray from './internal/magic-array.js';
import MagicMethod from './internal/magic-method.js';

var blacklist = new RegExp(
	'^(_.*|constructor|on_update|fill|out|errors|validate|extend|' +
	'keys|toString|toLocaleString|valueOf|hasOwnProperty|' +
	'isPrototypeOf|propertyIsEnumerable|should)$'
);

class Model {
	constructor(definition) {
		this._def = {};
		this._change_throttle = new ThrottledObserver();

		this.extend(definition);
	}

	on_update(field, callback) {
		this._change_throttle.on_fire(field, callback);
	}

	fill(data) {
		var ni;

		for (ni in data) {
			if (!this._def.hasOwnProperty(ni)) {
				continue;
			}

			this[ni] = data[ni];
		}

		return this;
	}

	out() {
		var out = {},
			ni, no, a;

		for (ni in this._def) {
			if (type(this._def[ni].default, 'array')) {
				a = [];

				if (this._def[ni].type) {
					for (no = 0; no < this._def[ni].value.length; no++) {
						/* istanbul ignore else */
						if (this._def[ni].value[no] instanceof Model) {
							a.push(this._def[ni].value[no].out());
						}
					}
				} else {
					a = this._def[ni].value.slice(0);
				}

				out[ni] = a;
				continue;
			}

			if (this._def[ni].value instanceof Model) {
				out[ni] = this._def[ni].value.out();
				continue;
			}

			out[ni] = this._def[ni].value;
		}

		return out;
	}

	extend(def) {
		var ni;

		for (ni in def) {
			if (blacklist.test(ni)) {
				continue;
			}

			if (def[ni] instanceof Model ||
					(type(def[ni], 'function') &&
						def[ni].prototype instanceof Model)) {
				this._def[ni] = {
					'default': null,
					value: new def[ni](),
					type: def[ni]
				};
			} else if (type(def[ni], 'array')) {
				this._def[ni] = {
					'default': [],
					type: def[ni].length ? def[ni][0] : null
				};

				this._def[ni].value = new MagicArray(
						this._def,
						ni,
						this._change_throttle
					);
			} else {
				this._def[ni] = {
					'default': def[ni],
					value: def[ni],
					type: null
				};
			}

			MagicMethod(this, this._def, ni, this._change_throttle); // eslint-disable-line
		}

		return this;
	}

	keys() {
		var out = [],
			tmp = {},
			curr = this, // eslint-disable-line
			props, ni;

		do {
			props = Object.getOwnPropertyNames(curr);
			for (ni = 0; ni < props.length; ni++) {
				if (blacklist.test(props[ni])) {
					continue;
				}
				tmp[props[ni]] = true;
			}
		} while ((curr = Object.getPrototypeOf(curr)));

		for (ni in tmp) {
			out.push(ni);
		}

		return out;
	}
}

export default Model;
