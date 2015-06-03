;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd'], factory);
	} else {
		factory($dd);
	}
})(function(lib){
	lib.mixin({
		subscribe: function(){
			var cache = [],
				ret = function(callback){
					if(!lib.type(callback,'function')){
						return;
					}
					cache.push(callback);
				};
			ret.fire = function(){
				var args = Array.prototype.slice.call(arguments,0),
					ni;
				for(ni = 0; ni < cache.length; ni++){
					cache[ni].apply(this,args);
				}
			};
			ret.remove = function(callback){
				var ni;
				for(ni = 0; ni < cache.length; ni++){
					if(cache[ni] !== callback){
						continue;
					}
					cache.splice(ni, 1);
					break;
				}
			};

			return ret;
		}
	});
});