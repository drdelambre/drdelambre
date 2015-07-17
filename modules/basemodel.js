// $dd.model
//		teh bones of any awesome web app. replaces the $dd.object paradigm
//		to reduce scope bugs and allow easier state migration through simple
//		objects.
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd','../polyfill/keys'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('../dd'));
	} else {
		factory($dd);
	}
})(function(lib){
	// stuff to exclude from the serialization
	var blacklist = /^(_.*|def|on_fill|on_out|fill|out|extend|attach|map|type|errors|validate)$/;

	var ret = function(){
		return function(def){
			var self = {},
				ni;

			// this stuff looks silly, but the previous method of iterating over
			// the function definitions and giving context with apply, disabled chrome
			// optimizations and slowed down these core functions
			self.fill = function(data) { return ret.fns.fill(self, data); };
			self.out = function() { return ret.fns.out(self); };
			self.clear = function() { return ret.fns.clear(self); };
			self.extend = function(_def) { return ret.fns.extend(self, _def); };
			self.attach = function(_def) { return ret.fns.attach(self, _def); };
			self.map = function(_maps) { return ret.fns.map(self, _maps); };
			self.on_fill = function(filter, fire_after) { return ret.fns.on_fill(self, filter, fire_after); };
			self.on_out = function(filter, fire_before) { return ret.fns.on_out(self, filter, fire_before); };
			self.validate = function(_map) { return ret.fns.validate(self, _map); };

			return self.extend(def);
		}
	};

	ret.fns = {
		fill: function(self,data){
			// does the heavy lifting for importing an object into a model

			data = data || {};

			var _pre = self._pre || [],
				def = self.def || {},
				ni, na, no, a;

			for(ni = 0; ni < _pre.length; ni++){
				if(!_pre[ni].after){
					_pre[ni].fun(data);
				}
			}

			for(ni in def){
				na = ni;
				for(no = 0; no < def[ni].external.length; no++){
					if(!data.hasOwnProperty(def[ni].external[no])){
						continue;
					}
					na = def[ni].external[no];
					break;
				}
				//catch when ni=na and !data[na]
				if(!data.hasOwnProperty(na)){
					continue;
				}

				a = null;
				if(!def[ni].type){
					self[ni] = data[na];
					continue;
				}
				if(!lib.type(def[ni]['default'], 'array')){
					if(def[ni].type === Date){
						if(lib.type(data[na],'date')){
							self[ni] = new def[ni].type(new Date(data[na].valueOf()));
						} else if(lib.type(data[na],'string') && !isNaN(Date.parse(data[na]))){
							self[ni] = new def[ni].type(new Date(data[na]));
						}
						continue;
					}
					if(data[na] === null){
						self[ni] = null;
						continue;
					}
					if(self[ni] && lib.type(self[ni].fill, 'function')){
						self[ni].fill(data[na]);
						continue;
					}
					self[ni] = new def[ni].type(data[na]);
					continue;
				}

				a = [];
				data[na] = data[na]||[];
				for(no = 0; no < data[na].length; no++){
					if(def[ni].type === Date){
						if(lib.type(data[na][no],'date')){
							self[ni] = new def[ni].type(new Date(data[na][no].valueOf()));
						} else if(lib.type(data[na][no],'string') && !isNaN(Date.parse(data[na][no]))){
							self[ni] = new def[ni].type(new Date(data[na][no]));
						}
						continue;
					}
					a.push(new def[ni].type(data[na][no]));
				}

				self[ni] = a;
			}

			for(ni = 0; ni < _pre.length; ni++){
				if(_pre[ni].after){
					_pre[ni].fun(data);
				}
			}

			return self;
		},
		out: function(self){
			// does the same as _sin, but for exporting

			var obj = {},
				def = self.def||{},
				_post = self._post ||[],
				ni, na, no, a;

			for(ni = 0; ni < _post.length; ni++){
				if(_post[ni].fire_before){
					_post[ni].fun(obj);
				}
			}

			for(ni in def){
				if(blacklist.test(ni)){
					continue;
				}

				na = def[ni].external[0]||ni;

				//gotta look for models WITHIN models
				if(!self[ni]){
					obj[na] = self[ni];
				} else if(self[ni].hasOwnProperty('out')){
					obj[na] = self[ni].out();
				} else if(lib.type(self[ni],'array')){
					obj[na] = [];
					for(no = 0; no < self[ni].length; no++){
						if(lib.type(self[ni][no],'function')){
							continue;
						}
						a = self[ni][no];
						if(lib.type(self[ni][no],'date')){
							a = a.toISOString();
						}
						if(lib.type(a,'object') && a.hasOwnProperty('out')){
							a = a.out();
						}
						obj[na].push(a);
					}
				} else if(lib.type(self[ni],'date')){
					obj[na] = self[ni].toISOString();
				} else if(lib.type(self[ni],'object')){
					obj[na] = {};
					for(no in self[ni]){
						if(lib.type(self[ni][no],'function')){
							continue;
						}
						a = self[ni][no];
						if(lib.type(a,'object') && a.hasOwnProperty('out')){
							a = a.out();
						}
						obj[na][no] = a;
					}
				} else {
					if(lib.type(self[ni],'function')){
						continue;
					}
					obj[na] = self[ni];
				}
			}

			for(ni = 0; ni < _post.length; ni++){
				if(!_post[ni].fire_before){
					_post[ni].fun(obj);
				}
			}

			return obj;
		},
		clear: function(self){
			for(var ni in self.def){
				self[ni] = self.def[ni]['default'];
			}
			return self;
		},
		extend: function(self,_def){
			// use models to make bigger models!
			if(!self.hasOwnProperty('def')){
				self.def = {};
			}
			_def = _def || {};

			var ni;
			for(ni in _def){
				if(blacklist.test(ni)){
					continue;
				}
				if(ni in self.def){
					self.def[ni]['default'] = _def[ni];
					self[ni] = _def[ni];
					continue;
				}

				self.def[ni] = {
					'default':lib.clone(_def[ni]),
					type: null,
					external: [],
					validation: []
				};

				self[ni] = _def[ni];
			}

			return self;
		},
		attach: function(self,_obj){
			for(var ni in _obj){
				if(blacklist.test(ni) || ni in self.def){
					continue;
				}
				self[ni] = _obj[ni];
			}
			return self;
		},
		map: function(self,_maps){
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
		},
		type: function(self,_types){
			// to have hierarchical chains of models, we need to be able
			// to specify a model type for those properties
			for(var ni in _types){
				if(!self.def.hasOwnProperty(ni)){
					continue;
				}
				self.def[ni].type = _types[ni];
			}
			return self;
		},
		on_fill: function(self,filter,fire_after){
			if(!self.hasOwnProperty('_pre')){
				self._pre = [];
			}

			// here we add filters that edit the json data before it enters
			self._pre.push({
				fun: filter,
				after: fire_after?1:0
			});
			return self;
		},
		on_out: function(self,filter,fire_before){
			// here we add filters that edit the json data before it leaves
			if(!self.hasOwnProperty('_post')){
				self._post = [];
			}

			self._post.push({
				fun: filter,
				after: fire_before?1:0
			});

			return self;
		},
		validate: function(self,_map){
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
		}
	};

	lib.mixin({
		basemodel: ret
	});

	return ret;
});
