/*********************************************************************\

	drDelambreLabs Namespace
	This is a collection of modules that i've crafted over the years
	for making large frontend engineering projects a lot easier.

\*********************************************************************/

// module: NAMESPACE
// this sets the scene for all other modules
var $dd = (function(){
	var inits = [];
	return {
		config : {},
		object : function(proto){
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
		},
		extend : function() {
			var options, name, ni, no,
				length = arguments.length;

			for(ni = 0; ni < length; ni++ ){
				if((options = arguments[ni]) !== null){
					for(name in options){
						if(name == 'config'){
							for(no in options[name]){
								$dd.config[no] = options[name][no];
							}
							continue;
						}
						if(options[name] !== undefined)
							this[name] = options[name];
					}
				}
			}
			return this;
		},
		init : function(val){
			if(arguments.length === 0){
				for(var ni = 0; ni < inits.length; ni++){
					if(typeof inits[ni] != 'function') continue;
					inits[ni]();
				}
				return;
			}
			if(typeof val != 'function') return;
			inits.push(val);
		}
	};
})();

// module: PUBSUB
// loose decoupling for all your custom modules
$dd.extend((function(){
	var cache = {};
	return {
		pub : function(){
			var topic = arguments[0],
				args = Array.prototype.slice.call(arguments, 1)||[],
				ni, t;

			for(t in cache){
				if(!topic.match(new RegExp(t)).length)
					continue;
				for(ni = 0; ni < cache[t].length; ni++){
					cache[t][ni].apply($dd, args);
				}
			}
		},
		sub : function(topic, callback){
			topic = '^' + topic.replace(/\*/,'.*');
			if(!cache[topic])
				cache[topic] = [];
			cache[topic].push(callback);
			return [topic, callback];
		},
		unsub : function(handle){
			var t = handle[0], ni;
			if(!cache[t]) return;
			for(ni in cache[t]){
				if(cache[t][ni] == handle[1])
					cache[t].splice(ni, 1);
			}
		}
	};
})());

// module: MODELS
// basic serialization to keep your data models clean
$dd.extend({
	model : (function(){
		var cleanNumbers = function(obj){
			if(!obj)
				return obj;
			if(!isNaN(parseFloat(obj)) && isFinite(obj))
				return parseFloat(obj);
			if(typeof obj == 'string'){
				if(obj == 'null' || obj === '')
					obj = null;
				if(!isNaN((new Date(obj)).valueOf()))
					obj = new Date(obj);
				return obj;
			}
			if(typeof obj == 'function')
				return obj;

			var ni;
			if(Object.prototype.toString.call(obj) == '[object Object]'){
				for(ni in obj)
					obj[ni] = cleanNumbers(obj[ni]);
			} else if(Object.prototype.toString.call(obj) == '[object Array]'){
				for(ni = 0; ni < obj.length; ni++)
					obj[ni] = cleanNumbers(obj[ni]);
			}

			return obj;
		};
		var s_out = function(model){
			var obj = {}, tmp, ni, na, no, a;
			for(ni in model.definition){
				if(/^(_.*|definition|prefilter|init|serialize|extend)$/.test(ni))
					continue;

				tmp = model[ni];
				na = model.definition[ni].hasOwnProperty('external')?model.definition[ni]['external']:ni;

				//gotta look for models WITHIN models
				if(!tmp){
					obj[na] = tmp;
				} else if(Object.prototype.toString.call(tmp) == '[object Array]'){
					obj[na] = [];
					for(no = 0; no < tmp.length; no++){
						if(typeof tmp[no] == 'function') continue;
						if(tmp[no].hasOwnProperty && tmp[no].hasOwnProperty('serialize'))
							tmp[no] = tmp[no].serialize();
						obj[na].push(tmp[no]);
					}
				} else if(Object.prototype.toString.call(tmp) == '[object Object]'){
					obj[na] = {};
					for(no in tmp){
						if(typeof tmp[no] == 'function') continue;
						if(tmp[no].hasOwnProperty && tmp[no].hasOwnProperty('serialize'))
							tmp[no] = tmp[no].serialize();
						obj[na][no] = tmp[no];
					}
				} else {
					if(typeof tmp == 'function') continue;
					obj[na] = tmp;
				}
			}
			return obj;
		};
		var s_in = function(model,data){
			var ni, na, no, a;
			if(!data){
				// reset to default values
				for(ni in model.definition){
					model[ni] = model.definition[ni]['default'];
				}
				return model;
			}
			if(typeof model.prefilter == 'function') model.prefilter(data);
			for(ni in model.definition){
				na = ni;
				if(model.definition[ni].hasOwnProperty('external'))
					na = model.definition[ni].external;
				if(!data.hasOwnProperty(na))
					continue;

				if(model.definition[ni].type){
					if(Object.prototype.toString.call(model.definition[ni]['default']) == '[object Array]'){
						a = [];
						for(no = 0; no < data[na].length; no++){
							a.push(new model.definition[ni].type(data[na][no]));
						}
						model[ni] = a;
					} else {
						model[ni] = new model.definition[ni].type(data[na]);
					}
				} else {
					model[ni] = cleanNumbers(data[na]);
				}
			}
			return model;
		};

		return $dd.object({
			definition: {},
			prefilter: null,

			init: function(def,data){
				this.definition = {};

				var ni, _def;
				for(ni in def){
					if(/^(_.*|definition|prefilter|init|serialize|extend)$/.test(ni))
						continue;
					if(Object.prototype.toString.call(def[ni]) != '[object Object]'){
						def[ni] = { 'default': def[ni] };
					}
					if(def[ni].type){
						_def = def[ni].type.split('.');
						def[ni].type = window;
						while(_def.length){
							def[ni].type = def[ni].type[_def.shift()];
						}
					}
					this.definition[ni] = def[ni];
					this[ni] = def[ni]['default'];
				}

				if(data) this.serialize(data);
			},
			serialize: function(data){
				if(arguments.length === 0)
					return s_out(this);
				return s_in(this,data);
			},
			extend: function(def, data){
				for(var ni in def){
					if(/^(_.*definition|prefilter|map|init|serialize|extend)$/.test(ni))
						continue;
					if(this.definition.hasOwnProperty(ni))
						continue;
					this.definition[ni] = def[ni];
					this[ni] = def[ni];
				}

				if(data) this.serialize(data);

				return this;
			},
			clone: function(){
				return new this(this.definition,this.serialize());
			}
		});
	})()
});

module.exports = $dd;