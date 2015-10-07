import Model from '../model.js';
import MagicArray from './magic-array.js';

function MagicMethod(obj, def, param, throttle) {
	Object.defineProperty(obj, param, {
		configurable: true,
		get() {
			return def[param].value;
		},
		set(val) {
			const last = def[param].value,
				is_array = Object.prototype
					.toString
					.call(def[param].default) === '[object Array]';
			let _val = val,
				ni, a;

			if (is_array) {
				if (def[param].type) {
					for (ni = 0; ni < val.length; ni++) {
						a = val[ni];

						if (typeof val[ni].fill !== 'function') {
							val[ni] = new def[param].type(a); // eslint-disable-line
						}
					}
				}
			} else if (def[param].type &&
				(def[param].type instanceof Model ||
					def[param].type.prototype instanceof Model) &&
				!(val instanceof def[param].type)) {
				_val = new def[param].type(val); // eslint-disable-line
			}

			// do some validation here

			if (def[param].value === _val) {
				return;
			}

			if (is_array &&
				!_val.hasOwnProperty('_def')) {
				def[param].value = new MagicArray(def, param, throttle, _val); // eslint-disable-line
			} else {
				def[param].value = _val;
			}

			throttle.add(param, {
				old: last,
				new: def[param].value
			});
		}
	});
}

export default MagicMethod;
