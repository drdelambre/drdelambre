// requestAnimationFrame polyfill c/o Erik Moller
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define([], factory);
	} else {
		factory();
	}
})(function(){
	window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame || (function(){
			var timeLast = 0;

			return function(callback) {
				var timeCurrent = (new Date()).getTime(),
					timeDelta;

				timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
				timeLast = timeCurrent + timeDelta;

				return setTimeout(function() { callback(timeCurrent + timeDelta); }, timeDelta);
			};
		})();
});