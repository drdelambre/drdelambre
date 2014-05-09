/* {"requires": ["dd"]} */
// $dd.toggle
//		another one of those helper functions to create a togglable
//		interface, because these are used a lot for all sorts of
//		things.
;(function(lib){
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
				if(lib.type(on_open,'function')){
					on_open();
				}
				ret.isOpen = true;

				return ret;
			};
			ret.close = function(){
				if(!ret.isOpen){
					return ret;
				}

				if(lib.type(on_close,'function')){
					on_close();
				}
				ret.isOpen = false;

				return ret;
			};

			return ret;
		}
	});
})($dd);
