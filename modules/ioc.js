/* {"requires":["dd"]} */
// $dd.ioc
//		Sometimes modules have to talk to each other. Instead of polluting
//		the global namespace, we use an inversion of control pattern to
//		dynamically reference modules. You can just do module pattern style
//		dependency injection instead, but that gets ugly. This operates
//		like a service layer. Useful for things like userauth and page
//		configurations.
$dd.mixin({
	ioc: (function(){
		var ret = {},
			hash = {};

		ret.register = function(lookup,constructor){
			hash[lookup] = { c: constructor, i: null };
		};

		ret.get = function(lookup){
			if(!hash.hasOwnProperty(lookup))
				throw new Error('$dd.di: nothing hooked up to ' + lookup);
			if(!hash[lookup].i)
				hash[lookup].i = new hash[lookup].c();
			return hash[lookup].i;
		};

		return ret;
	})()
});