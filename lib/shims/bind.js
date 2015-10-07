// bind polyfill for setting function scope
if (!Function.prototype.bind) {
	Function.prototype.bind = function(oThis) { //eslint-disable-line
		var aArgs = Array.prototype.slice.call(arguments, 1),
			self = this,
			fNOP = function() {},
			fBound = function() {
				return self.apply(
					this instanceof fNOP && oThis ? this : oThis,
					aArgs.concat(Array.prototype.slice.call(arguments))
				);
			};

		if (typeof this !== 'function') {
			throw new TypeError('Function.prototype.bind' +
				' - what is trying to be bound is not callable');
		}

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}
