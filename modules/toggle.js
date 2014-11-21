// $dd.toggle
//		another one of those helper functions to create a togglable
//		interface, because these are used a lot for all sorts of
//		things.
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
		toggle: function(on_open,on_close){
			var ret = function(){
				if(ret.isOpen){
					return ret.close();
				}
				return ret.open();
			};
			ret.isOpen = false;
			ret.open = function(){
				if(ret.isOpen){
					return ret;
				}

				ret.isOpen = true;
				if(lib.type(on_open,'function')){
					on_open();
				}

				return ret;
			};
			ret.close = function(){
				if(!ret.isOpen){
					return ret;
				}

				ret.isOpen = false;
				if(lib.type(on_close,'function')){
					on_close();
				}

				return ret;
			};

			return ret;
		}
	});
});
