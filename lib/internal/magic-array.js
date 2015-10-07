/**\

	MagicArray
		extends in place array operations to inject
		field contructors and watch events for a
		model's array based fields

\**/
class MagicArray extends Array {
	constructor(def, param, throttle, base = []) {
		super();

		this._def = def[param];
		this._param = param;
		this._throttle = throttle;

		Array.prototype.splice.apply(this, [ 0, 0 ].concat(base));
	}

	push(...args) {
		var old = this.slice(0),
			ni;

		if (this._def.type) {
			for (ni = 0; ni < args.length; ni++) {
				if (typeof args[ni].out === 'function') {
					args[ni] = args[ni].out();
				}

				args[ni] = new this._def.type(args[ni]); // eslint-disable-line
			}
		}

		Array.prototype.push.apply(this, args);

		this._throttle.add(this._param, {
			old: old,
			new: this.slice(0)
		});

		this._def.value = this;

		return this;
	}

	pop() {
		var old = this.slice(0),
			out = Array.prototype.pop.apply(this);

		this._throttle.add(this._param, {
			old: old,
			new: this.slice(0)
		});

		this._def.value = this;

		return out;
	}

	shift() {
		var old = this.slice(0);

		Array.prototype.shift.apply(this);

		this._throttle.add(this._param, {
			old: old,
			new: this.slice(0)
		});

		this._def.value = this;

		return this;
	}

	unshift(...args) {
		var old = this.slice(0),
			ni, out;

		if (this._def.type) {
			for (ni = 0; ni < args.length; ni++) {
				if (args[ni] instanceof this._def.type) {
					continue;
				}

				args[ni] = new this._def.type(args[ni]); // eslint-disable-line
			}
		}

		out = Array.prototype.unshift.apply(this, args);

		this._throttle.add(this._param, {
			old: old,
			new: this.slice(0)
		});

		this._def.value = this;

		return out;
	}

	splice(...args) {
		var old = this.slice(0),
			ni;

		if (this._def.type && args.length > 2) {
			for (ni = 2; ni < args.length; ni++) {
				if (args[ni] instanceof this._def.type) {
					continue;
				}

				args[ni] = new this._def.type(args[ni]); // eslint-disable-line
			}
		}

		Array.prototype.splice.apply(this, args);

		this._throttle.add(this._param, {
			old: old,
			new: this.slice(0)
		});

		this._def.value = this;

		return this;
	}

	concat(...args) {
		return Array.prototype.concat.apply(this.slice(0), args);
	}
}

export default MagicArray;
