// $dd.ioc
//		Sometimes modules have to talk to each other. Instead of polluting
//		the global namespace, we use an inversion of control pattern to
//		dynamically reference modules. You can just do module pattern style
//		dependency injection instead, but that gets ugly. This operates
//		like a service layer. Useful for things like userauth and page
//		configurations.
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('../dd'));
	} else {
		factory($dd);
	}
})(function(lib){
	lib.mixin({
		ioc: (function(){
			var ret = {},
				hash = {};

			ret.register = function(lookup,constructor){
				hash[lookup] = { c: constructor, i: null };
			};

			ret.get = function(lookup){
				if(!hash.hasOwnProperty(lookup)){
					throw new Error('$dd.ioc: nothing hooked up to ' + lookup);
				}
				//lazy loading method seems to be broken for now
//				if(!hash[lookup].i){
//					hash[lookup].i = hash[lookup].c();
//				}
				return hash[lookup].c();
			};

			return ret;
		})()
	});
});
