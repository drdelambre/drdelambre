import { type } from './util.js';
import ThrottledObserver from './throttled-observer.js';
import MagicArray from './internal/magic-array.js';
import MagicMethod from './internal/magic-method.js';

var blacklist = new RegExp(
	'^(_.*|constructor|on_update|fill|out|errors|validate|extend|' +
	'keys|toString|toLocaleString|valueOf|hasOwnProperty|' +
	'isPrototypeOf|propertyIsEnumerable|should|before)$'
);

/**\

	Model

	jazz up them boring javascript objects

\**/
class Model {
	constructor(definition) {
		this._def = {};
		this._change_throttle = new ThrottledObserver();

		this.extend(definition);
	}

	/**\

		Model.on_update

		connect callbacks to specific property updates after they've
		been assigned. usage of the string '*' will fire the callback
		if any property changes. changes are also cached into a 10ms
		bucket, so many assignments will be compressed to one change:

			var model = Model({
					id: 12
				})
				.on_update('id', function(change) {
					console.log('changed', change);
				});
			model.id = -37;
			model.id = 'yolo';
			model.id = { };
			model.id = 13;
			model.id = 'new value';

		will output:
			changed { old: 12, new: 'new value' }

	\**/
	on_update(field, callback) {
		this._change_throttle.on_fire(field, callback);
	}

	/**\

		Model.fill

		takes a boring old javascript object and loads it into the model.
		most of this functionality, and the rules by which this happens,
		is set up from the Model.extend function

	\**/
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

	/**\

		Model.out

		serializes all of the properties of the model, transforming them
		from rich and dynamic models, to plain old javascript objects to
		allow for easier (and cleaner) transference between modules

	\**/
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

	/**\

		Model.extend

		sets up properties on the model. there's a few syntactic rules:
		{ id: 0 }
			sets up a simple property with a default value
		{ items: [] }
			sets up a simple array, connected to the on_update and
			before subsytems
		{ user: User }
			if the default value is another Model, object hierarchies
			get set up, calling their constructor on creation or fill
			on subsequent assignments/fills
		{ users: [ User ] }
			connecting the basic array definition with the object
			hierarchy machanism. Makin cool stuff happen.

	\**/
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
					type: def[ni],
					before: []
				};
			} else if (type(def[ni], 'array')) {
				this._def[ni] = {
					'default': [],
					type: def[ni].length ? def[ni][0] : null,
					before: []
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
					type: null,
					before: []
				};
			}

			MagicMethod(this, this._def, ni, this._change_throttle); // eslint-disable-line
		}

		return this;
	}

	/**\

		Model.before

		Sets up a collection of functions to validate or transform
		assignments. Each function should return an array of
			[ has_error, transformed_value ]
		Assignment of the value to the property is canceled if has_error
		returns true in any of the validation functions and transformation is
		done in order of function assignment to the property. The
		transformation chain is stopped the first time a function returns
		an error state

	\**/
	before(def) {
		var ni;

		function is_func(val) {
			return type(val, 'function');
		}

		for (ni in def) {
			if (!this._def.hasOwnProperty(ni)) {
				throw new Error(
					'Model: called before on a property (' +
					ni + ') that does not exist');
			}

			if (!type(def[ni], 'array')) {
				def[ni] = [ def[ni] ];
			}

			def[ni].filter(is_func);

			this._def[ni].before = this._def[ni].before.concat(def[ni]);
		}

		return this;
	}

	/**\

		Model.keys

		returns a list of all properties and functions attached to
		the model, minus the default built in ones

	\**/
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
