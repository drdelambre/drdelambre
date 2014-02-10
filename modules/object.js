// $dd.object
//		classical inheritance pattern for javascript. This one makes
//		really pretty object structures, but bugs in function scope
//		have been problematic for junior developers, so it has fallen
//		out of fasion.
// requires: $dd
;(function(){
	$dd.mixin({
		object: function(proto){
			var fun = function(){
				if(!(this instanceof arguments.callee))
					throw new Error('$dd.object: not called as a constructor (try adding "new")');
				var defs = {},
					beans;
				for(var member in proto){
					if(typeof proto[member] !== 'function'){
						this[member] = proto[member];
						continue;
					}
					this[member] = proto[member].bind(this);

					if(/^_[gs]et/.test(member)){
						beans = member.slice(4);
						if(!defs[beans]) defs[beans] = {};
						defs[beans][(/^_get/.test(member)?'get':'set')] = this[member];
					}
				}
				for(var ni in defs)
					Object.defineProperty(this,ni,defs[ni]);

				if(this.init) this.init.apply(this,arguments);
			};

			fun.prototype = proto || {};
			return fun;
		}
	});
})();
