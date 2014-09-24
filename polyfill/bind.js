// bind polyfill for setting function scope
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define([], factory);
	} else {
		factory();
	}
})(function(){
	if(Function.prototype.bind){
		return;
	}
	Function.prototype.bind = function(oThis){		// jshint ignore:line
		if(typeof this !== "function"){
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}

		var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function(){},
			fBound = function(){
				return fToBind.apply(this instanceof fNOP && oThis?this:oThis,
							aArgs.concat(Array.prototype.slice.call(arguments)));
			};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
});
