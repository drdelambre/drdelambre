/**\

	MagicArray
		extends in place array operations to inject
		field contructors and watch events for a
		model's array based fields

		extending native objects must be supported by the
		engine and not transpilers, so the is written in an
		es5 format for correct this binding to the prototype
		functions

\**/
function MagicArray(def, param, throttle, base = []) {
	if (!(this instanceof MagicArray)) {
		throw new Error('MagicArray: Cannot call a class as a function');
	}

	Array.call(this);

	this._def = def[param];
	this._param = param;
	this._throttle = throttle;

	Array.prototype.splice.apply(this, [ 0, 0 ].concat(base));
}

MagicArray.prototype = Object.create(Array.prototype, {
	contructor: {
		value: MagicArray,
		enumerable: false,
		writable: true,
		configurable: true
	}
});

MagicArray.prototype.push = function(...args) {
	var old = this.slice(0),
		valid = true,
		ni, still_valid, against;

	if (this._def.type) {
		for (ni = 0; ni < args.length; ni++) {
			if (typeof args[ni].out === 'function') {
				args[ni] = args[ni].out();
			}

			args[ni] = new this._def.type(args[ni]); // eslint-disable-line
		}
	}

	// do some validation here

	Array.prototype.push.apply(this, args);

	this._throttle.add(this._param, {
		old: old,
		new: this.slice(0)
	});

	this._def.value = this;

	return this;
};

MagicArray.prototype.pop = function() {
	var old = this.slice(0),
		out;

	// do some validation here

	out = Array.prototype.pop.apply(this);

	this._throttle.add(this._param, {
		old: old,
		new: this.slice(0)
	});

	this._def.value = this;

	return out;
};

MagicArray.prototype.shift = function() {
	var old = this.slice(0);

	// do some validation here

	Array.prototype.shift.apply(this);

	this._throttle.add(this._param, {
		old: old,
		new: this.slice(0)
	});

	this._def.value = this;

	return this;
};

MagicArray.prototype.unshift = function(...args) {
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

	// do some validation here

	out = Array.prototype.unshift.apply(this, args);

	this._throttle.add(this._param, {
		old: old,
		new: this.slice(0)
	});

	this._def.value = this;

	return out;
};

MagicArray.prototype.splice = function(...args) {
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

	// do some validation here

	Array.prototype.splice.apply(this, args);

	this._throttle.add(this._param, {
		old: old,
		new: this.slice(0)
	});

	this._def.value = this;

	return this;
};

MagicArray.prototype.concat = function(...args) {
	return Array.prototype.concat.apply(this.slice(0), args);
};

export default MagicArray;
