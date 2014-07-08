// $dd.model
//		teh bones of any awesome web app. replaces the $dd.object paradigm
//		to reduce scope bugs and allow easier state migration through simple
//		objects.
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd','../polyfill/keys'], factory);
	} else {
		factory($dd);
	}
})(function(lib){
	// stuff to exclude from the serialization
	var blacklist = /^(_.*|def|on_fill|on_out|fill|out|extend|attach|map|type|errors|validate)$/;

	// lets only add clean data to our models
	function _cleanNumbers(obj){
		var type = lib.type(obj),
			ni;

		if(/^(b.*|nu.*|f.*)$/.test(type)){
			return obj;
		}

		if(type === 'string'){
			if(!obj || obj === 'null'){
				obj = null;
			} else if(!isNaN(parseFloat(obj)) && isFinite(obj)){
				return parseFloat(obj);
			}

			return obj;
		}

		if(type === 'array'){
			for(ni = 0; ni < obj.length; ni++){
				obj[ni] = _cleanNumbers(obj[ni]);
			}
		}

		if(type === 'object'){
			for(ni in obj){
				obj[ni] = _cleanNumbers(obj[ni]);
			}
		}

		return obj;
	}

	function _makeArray(model,index){
		var a = [];
		a.push = function(){
			var args = Array.prototype.slice.call(arguments,0),
				ni;

			if(model.def[index].type !== null){
				for(ni = 0; ni < args.length; ni++){
					if(args[ni].hasOwnProperty('out') && lib.type(args[ni].out,'function')){
						args[ni] = args[ni].out();
					}
					args[ni] = model.def[index].type(args[ni]);
				}
			}

			Array.prototype.push.apply(a,args);
		};
		a.unshift = function(){
			var args = Array.prototype.slice.call(arguments,0),
				ni;
			if(model.def[index].type !== null){
				for(ni = 0; ni < args.length; ni++){
					if(args[ni].hasOwnProperty('out') && lib.type(args[ni].out,'function')){
						args[ni] = args[ni].out();
					}
					args[ni] = model.def[index].type(args[ni]);
				}
			}

			Array.prototype.unshift.apply(a,args);
		};
		a.splice = function(){
			var args = Array.prototype.slice.call(arguments,0),
				ni;
			if(model.def[index].type !== null && args.length > 2){
				for(ni = 2; ni < args.length; ni++){
					if(args[ni].hasOwnProperty('out') && lib.type(args[ni].out,'function')){
						args[ni] = args[ni].out();
					}
					args[ni] = model.def[index].type(args[ni]);
				}
			}

			Array.prototype.unshift.apply(a,args);
		};

		return a;
	}

	// does the heavy lifting for importing an object into a model
	function _sin(model,data){
		var ni, na, no, a;

		for(ni = 0; ni < model._pre.length; ni++){
			if(!model._pre[ni].after){
				model._pre[ni].fun(data);
			}
		}

		for(ni in model.def){
			na = ni;
			for(no = 0; no < model.def[ni].external.length; no++){
				if(!data.hasOwnProperty(model.def[ni].external[no])){
					continue;
				}
				na = model.def[ni].external[no];
				break;
			}
			//catch when ni=na and !data[na]
			if(!data.hasOwnProperty(na)){
				continue;
			}

			a = null;
			if(!model.def[ni].type){
				model[ni] = _cleanNumbers(data[na]);
				continue;
			}
			if(!lib.type(model.def[ni]['default'], 'array')){
				if(model.def[ni].type === Date){
					if(lib.type(data[na],'date')){
						model[ni] = new model.def[ni].type(new Date(data[na].valueOf()));
					} else if(lib.type(data[na],'string') && !isNaN(Date.parse(data[na]))){
						model[ni] = new model.def[ni].type(new Date(data[na]));
					}
					continue;
				}
				model[ni] = new model.def[ni].type(data[na]);
				continue;
			}

			a = [];
			data[na] = data[na]||[];
			for(no = 0; no < data[na].length; no++){
				if(model.def[ni].type === Date){
					if(lib.type(data[na][no],'date')){
						model[ni] = new model.def[ni].type(new Date(data[na][no].valueOf()));
					} else if(lib.type(data[na][no],'string') && !isNaN(Date.parse(data[na][no]))){
						model[ni] = new model.def[ni].type(new Date(data[na][no]));
					}
					continue;
				}
				a.push(new model.def[ni].type(data[na][no]));
			}

			model[ni] = a;
		}

		for(ni = 0; ni < model._pre.length; ni++){
			if(model._pre[ni].after){
				model._pre[ni].fun(data);
			}
		}

		return model;
	}

	// does the same as _sin, but for exporting
	function _sout(model){
		var obj = {},
			ni, na, no;

		for(ni = 0; ni < model._post.length; ni++){
			if(model._post[ni].fire_before){
				model._post[ni](obj);
			}
		}

		for(ni in model.def){
			if(blacklist.test(ni)){
				continue;
			}

			na = model.def[ni].external[0]||ni;

			//gotta look for models WITHIN models
			if(!model[ni]){
				obj[na] = model[ni];
			} else if(model[ni].hasOwnProperty('out')){
				obj[na] = model[ni].out();
			} else if(lib.type(model[ni],'array')){
				obj[na] = [];
				for(no = 0; no < model[ni].length; no++){
					if(lib.type(model[ni][no],'function')){
						continue;
					}
					if(lib.type(model[ni][no],'date')){
						model[ni][no] = model[ni][no].toISOString();
					}
					if(lib.type(model[ni][no],'object') && model[ni][no].hasOwnProperty('out')){
						model[ni][no] = model[ni][no].out();
					}
					obj[na].push(model[ni][no]);
				}
			} else if(lib.type(model[ni],'date')){
				obj[na] = model[ni].toISOString();
			} else if(lib.type(model[ni],'object')){
				obj[na] = {};
				for(no in model[ni]){
					if(lib.type(model[ni][no],'function')){
						continue;
					}
					if(lib.type(model[ni][no],'object') && model[ni][no].hasOwnProperty('out')){
						model[ni][no] = model[ni][no].out();
					}
					obj[na][no] = model[ni][no];
				}
			} else {
				if(lib.type(model[ni],'function')){
					continue;
				}
				obj[na] = model[ni];
			}
		}

		for(ni = 0; ni < model._post.length; ni++){
			if(!model._post[ni].fire_before){
				model._post[ni](obj);
			}
		}

		return obj;
	}

	// mmmmmm factory
	var ret = function(def){
		var self = {
			_pre: [],
			_post: [],
			errors: {},
			def: {}
		};

		self.fill = function(data){
			data = data||{};
			return _sin(self,data);
		};
		self.out = function(){
			return _sout(self);
		};
		self.clear = function(){
			for(var ni in self.def){
				self[ni] = self.def[ni]['default'];
			}
			return self;
		};
		self.extend = function(_def){
			// use models to make bigger models!
			var ni;
			for(ni in _def){
				if(blacklist.test(ni)){
					continue;
				}
				if(ni in self.def){
					continue;
				}

				self.def[ni] = {
					'default':lib.clone(_def[ni]),
					type: null,
					external: [],
					validation: []
				};

				if(lib.type(_def[ni], 'array')){
					self[ni] = _makeArray(self,ni);
				} else {
					self[ni] = _def[ni];
				}

			}

			return self;
		};
		self.attach = function(_obj){
			for(var ni in _obj){
				if(blacklist.test(ni) || ni in self.def){
					continue;
				}
				self[ni] = _obj[ni];
			}
			return self;
		};
		self.map = function(_maps){
			// internal name on the left side, external on the right
			// for keeping your clean data model in sync with your ugly api
			for(var ni in _maps){
				if(!self.def.hasOwnProperty(ni)){
					continue;
				}
				if(!lib.type(_maps[ni],'array')){
					_maps[ni] = [_maps[ni]];
				}
				self.def[ni].external = _maps[ni];
			}
			return self;
		};
		self.type = function(_types){
			// to have hierarchical chains of models, we need to be able
			// to specify a model type for those properties
			for(var ni in _types){
				if(!self.def.hasOwnProperty(ni)){
					continue;
				}
				self.def[ni].type = _types[ni];
			}
			return self;
		};
		self.on_fill = function(filter,fire_after){
			// here we add filters that edit the json data before it enters
			self._pre.push({
				fun: filter,
				after: fire_after?1:0
			});
			return self;
		};
		self.on_out = function(filter,fire_before){
			// here we add filters that edit the json data before it leaves
			self._post.push({
				fun: filter,
				after: fire_before?1:0
			});
			return self;
		};
		self.validate = function(_map){
			// if called with the _map argument, this function attaches
			// validation functions to the model fields denoted by the _map
			// object's key. if no _map is sent, this function calls upon
			// those mapped functions, and if any of them return an error,
			// connects it to self.errors and returns false. if everything is
			// gravy, the function returns true.
			var ni,no,v,e;
			if(!arguments.length){
				self.errors = [];

				for(ni in self.def){
					v = self.def[ni].validation||[];
					for(no = 0; no < v.length; no++){
						e = v[no](self[ni]);
						if(!lib.type(e,'array') || !e.length){
							continue;
						}
						self.errors[ni] = e;
					}
				}

				if(!Object.keys(self.errors).length){
					return true;
				}

				return false;
			}

			for(ni in _map){
				if(!self.def.hasOwnProperty(ni)){
					continue;
				}
				if(!lib.type(_map[ni],'array')){
					_map[ni] = [ _map[ni] ];
				}
				self.def[ni].validation = self.def[ni].validation.concat(_map[ni]);
			}

			return self;
		};

		//initialization
		return self.extend(def);
	};

	lib.mixin({
		model : ret
	});
});
