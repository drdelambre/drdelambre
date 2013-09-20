/**------------------------------------------------------------------------**\

	THE NAMESPACE!
	This is a collection of modules that i've crafted over the years
	for making large frontend engineering projects a lot easier. It
	has knockout built in for now.
	You can extend it by checking out the mixin function.

	By default, it comes with:
		$dd.type: unified type checking
		$dd.clone: pass by reference is too hard for junior devs 
		$dd.extend: smash objects together
		$dd.mixin: extend the namespace
		$dd.init: delay functionality until the dom is ready

	Then we mix in some of these gems (you can remove if inclined):
		$dd.pub: publish data to the pubsub
		$dd.sub: subscribe to messages comming from the pubsub
		$dd.unsub: stop listening to that crap

		$dd.object: classical inheritance for the die hards

		$dd.model: keep your data model clean

		$dd.route: single page routing module

		$dd.dom: query selectors and basic dom manipulation
		$dd.touch: normalize input across devices
		$dd.keys: an easy way to do complex key mappings 

		$dd.api: small ajax normalizer 

\**------------------------------------------------------------------------**/
window.$dd = window.$dd || (function(){
	var self = {};

	// $dd.type:
	//		lets shrink some code. Calling without the type variable
	//		just returns the type, calling it with returns a boolean
	//		you can pass a comma seperated list of types to match against
	self.type = function(variable,type){
		var t = typeof variable,
			trap = false,
			more,ni;

		if(t == 'object'){
			more = Object.prototype.toString.call(variable);
			if(more == '[object Array]')
				t = 'array';
			else if(more == '[object Null]')
				t = 'null';
			else if(more == '[object Date]')
				t = 'date';
			else if(variable == window)
				t = 'node';
			else if(variable.nodeType){
				if(variable.nodeType == 1)
					t = 'node';
				else
					t = 'textnode';
			}
		}

		if(!type) return t;
		type = type.split(',');
		for(more = 0; more < type.length; more++)
			trap = trap || (type[more] == t);
		return t == type;
	};

	// $dd.mixin:
	//		This is how we extend the namespace to handle new functionality
	//		it'll overwrite crap, so be carefull
	self.mixin = function(obj){
		if(!self.type(obj,'object'))
			throw new Error('$dd.mixin called with incorrect parameters');
		for(var ni in obj){
			if(/(mixin)/.test(ni))
				throw new Error('mixin isn\'t allowed for $dd.mixin');
			self[ni] = obj[ni];
		}
	};

	// $dd.init:
	//		Stores up function calls until the document.ready
	//		then blasts them all out
	self.init = (function(){
		var c = [], t, ni;
		t = setInterval(function(){
			if(!document.body) return;
			clearInterval(t);
			t = null;
			setTimeout(function(){
				for(ni = 0; ni < c.length; ni++)
					c[ni]();
			},200);
		},10);
		return function(_f){
			if(!t)
				_f();
			else
				c.push(_f);
		};
	})();

	// $dd.extend:
	//		throw a bunch of objects in and it smashes
	//		them together from right to left
	//		returns a new object
	self.extend = function(){
		if(!arguments.length)
			throw new Error('$dd.extend called with too few parameters');

		var out = {},
			ni,no;

		for(ni = 0; ni < arguments.length; ni++){
			if(!$dd.type(arguments[ni],'object'))
				continue;
			for(no in arguments[ni])
				out[no] = arguments[ni][no];
		}

		return out;
	};

	// $dd.clone:
	//		lets keep our data clean and seperated
	self.clone = function(obj){
		var type = self.type(obj);
		if(!/^(object||array||date)$/.test(type))
			return obj;
		if(type == 'date')
			return (new Date()).setTime(obj.getTime());
		if(type == 'array')
			return obj.slice(0);

		var copy = {},
			ni;

		for(ni in obj) {
			if(obj.hasOwnProperty(ni))
				copy[ni] = self.clone(obj[ni]);
		}

		return copy;
	};

	return self;
})();

// $dd.object
//		classical inheritance pattern for javascript
$dd.mixin((function(){
	//bind polyfill
	if(!Function.prototype.bind){
		Function.prototype.bind = function(oThis){
			if(typeof this !== "function") {
				// closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}

			var aArgs = Array.prototype.slice.call(arguments, 1),
				fToBind = this,
				fNOP = function(){},
				fBound = function(){
					return fToBind.apply(this instanceof fNOP && oThis?this:oThis,
								aArgs.concat(Array.prototype.slice.call(arguments)));
				};
		
			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();
		
			return fBound;
		};
	}

	return {
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
	};
})());

// $dd.pubsub
//		loose coupling for all your custom modules
//		make sure to document your messages, as they're
//		easy to bury in the code
$dd.mixin((function(){
	var cache = {};
	return {
		pub : function(){
			var topic = arguments[0],
				args = Array.prototype.slice.call(arguments, 1)||[],
				ni, t;

			for(t in cache){
				if(!(new RegExp(t)).test(topic))
					continue;
				for(ni = 0; ni < cache[t].length; ni++)
					cache[t][ni].apply($dd, args);
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


// $dd.model
//		teh bones of any awesome web app
$dd.mixin({
	model : (function(){
		// stuff to exclude from the serialization
		// and a polyfill for knockout until that bit is sorted out
		var blacklist = /^(_.*|def|pre|post|serialize|extend|map|type|watch|errors|validate)$/,
			ko = window.ko||{
				observable: function(val){
					var ret = function(){ return val; };
					ret._is_observable = true;
					return ret;
				},
				observableArray: function(val){
					var ret = function(){ return val; },
						list = ['push','pop','shift','unshift','length','concat','reverse','indexOf','slice','splice','sort','toString','valueOf'],
						ni;
					var maker = function(obj,method){
						return function(){
							return obj[method](arguments);
						};
					};

					for(ni = 0; ni < list.length; ni++){
						ret[list[ni]] = maker(val,list[ni]);
					}

					return ret;
				},
				utils: {
					unwrapObservable: function(val){
						if(val && val.hasOwnProperty('_is_observable'))
							return val();
						return val;
					}
				}
			};

		// lets only add clean data to our models
		function _cleanNumbers(obj){
			var type = $dd.type(obj),
				ni;

			if(/^(b.*|nu.*|f.*)$/.test(type))
				return obj;

			if(type == 'string'){
				if(!obj || obj == 'null')
					obj = null;
				else if(!isNaN(parseFloat(obj)) && isFinite(obj))
					return parseFloat(obj);

				return obj;
			}

			if(type == 'array'){
				for(ni = 0; ni < obj.length; ni++)
					obj[ni] = _cleanNumbers(obj[ni]);
			}

			if(type == 'object'){
				for(ni in obj)
					obj[ni] = _cleanNumbers(obj[ni]);
			}

			return obj;
		}

		// something needed to normalize knockout stuff
		function _cleanRead(model,key){
			if(model.def[key].observable)
				return model[key]();
			return model[key];
		}
		// something needed to normalize knockout stuff
		function _cleanWrite(model,key,val){
			if(model.def[key].observable)
				model[key](val);
			else
				model[key] = val;
		}

		// does the heavy lifting for importing an object into a model
		function _sin(model,data){
			var ni, na, no, a;
			if(!data){
				// reset to default values
				for(ni in model.def)
					_cleanWrite(model,ni,model.def[ni]['default']);
				return model;
			}

			for(ni = 0; ni < model._pre.length; ni++)
				model._pre[ni](data);

			for(ni in model.def){
				na = ni;
				for(no = 0; no < model.def[ni].external.length; no++){
					if(!data.hasOwnProperty(model.def[ni].external[no]))
						continue;
					na = model.def[ni].external[no];
					break;
				}
				console.log(na);
				//catch when ni=na and !data[na]
				if(!data.hasOwnProperty(na))
					continue;

				a = null;
				if(!model.def[ni].type){
					_cleanWrite(model,ni,_cleanNumbers(data[na]));
					continue;
				}
				if(!$dd.type(model.def[ni]['default'], 'array')){
					_cleanWrite(model,ni, new model.def[ni].type(data[na]));
					continue;
				}

				a = [];
				data[na] = data[na]||[];
				for(no = 0; no < data[na].length; no++)
					a.push(new model.def[ni].type(data[na][no]));

				_cleanWrite(model,ni,a);
			}

			return model;
		}

		// does the same as _sin, but for exporting
		function _sout(model){
			var obj = {},
				uwrap = ko.utils.unwrapObservable,
				tmp, ni, na, no, a;
			for(ni in model.def){
				if(blacklist.test(ni))
					continue;

				tmp = uwrap(model[ni]);

				na = model.def[ni].external[0]||ni;

				//gotta look for models WITHIN models
				if(!tmp){
					obj[na] = tmp;
				} else if(tmp.hasOwnProperty('serialize')){
					obj[na] = tmp.serialize();
				} else if($dd.type(tmp,'array')){
					obj[na] = [];
					for(no = 0; no < tmp.length; no++){
						a = uwrap(tmp[no]);
						if($dd.type(a,'function')) continue;
						if($dd.type(a,'object') && a.hasOwnProperty('serialize'))
							a = a.serialize();
						obj[na].push(a);
					}
				} else if($dd.type(tmp,'object')){
					obj[na] = {};
					for(no in tmp){
						a = uwrap(tmp[no]);
						if($dd.type(a,'function')) continue;
						if($dd.type(a,'object') && a.hasOwnProperty('serialize'))
							a = a.serialize();
						obj[na][no] = a;
					}
				} else {
					if($dd.type(tmp,'function')) continue;
					obj[na] = tmp;
				}
			}

			if($dd.type(model._post,'array')){
				for(ni = 0; ni < model._post.length; ni++)
					model._post[ni](obj);
			}

			return obj;
		}

		// mmmmmm factory
		return function(def){
			var self = {
				_pre: [],
				_post: [],
				errors: [],
				def: {}
			};

			// all these functions chain!!!! GO NUTS!
			self.serialize = function(data){
				// no arguments, you export data from the model
				// with an object, you import
				if(arguments.length === 0)
					return _sout(self);
				return _sin(self,data);
			};
			self.extend = function(_def){
				// use models to make bigger models!
				var ni, clone;
				for(ni in _def){
					if(blacklist.test(ni))
						continue;
					if(ni in self.def)
						continue;

					self.def[ni] = {
						'default':$dd.clone(_def[ni]),
						observable: false,
						type: null,
						external: [],
						validation: []
					};

					self[ni] = _def[ni];
				}

				return self;
			};
			self.map = function(_maps){
				// internal name on the left side, external on the right
				// for keeping your clean data model in sync with your ugly api
				for(var ni in _maps){
					if(!self.def.hasOwnProperty(ni)) continue;
					if(!$dd.type(_maps[ni],'array'))
						_maps[ni] = [_maps[ni]];
					self.def[ni].external = _maps[ni];
				}
				return self;
			};
			self.type = function(_types){
				// to have hierarchical chains of models, we need to be able
				// to specify a model type for those properties
				for(var ni in _types){
					if(!self.def.hasOwnProperty(ni)) continue;
					self.def[ni].type = _types[ni];
				}
				return self;
			};
			self.pre = function(filter){
				// here we add filters that edit the json data before it enters
				self._pre.push(filter);
				return self;
			};
			self.post = function(filter){
				// here we add filters that edit the json data before it leaves
				self._post.push(filter);
				return self;
			};
			self.watch = function(_map){
				var ni,isArray;
				//make all the things observable!
				if(!arguments.length){
					_map = {};
					for(ni in self.def)
						_map[ni] = true;
				}
				// this bad boy controls which properties are observable
				for(ni in _map){
					if(!self.def.hasOwnProperty(ni)) continue;
					if(_map[ni] == self.def[ni].observable) continue;
					self.def[ni].observable = _map[ni];
					isArray = $dd.type(self.def[ni]['default'],'array');
					if(_map[ni])
						self[ni] = ko['observable'+(isArray?'Array':'')](self[ni]);
					else
						self[ni] = ko.unwrapObservable(self[ni]);
				}
				return self;
			};
			self.validate = function(_map){
				var ni,no,v,e;
				if(!arguments.length){
					self.errors = [];

					for(ni in self.def){
						v = self.def[ni].validation||[];
						for(no = 0; no < v.length; no++){
							e = v[no](_cleanRead(self,ni));
							if(!$dd.type(e,'array')) continue;
							self.errors = self.errors.concat(e);
						}
					}
					if(!self.errors.length)
						return true;
					return false;
				}

				for(ni in _map){
					self.def[ni].validation.push(_map[ni]);
				}

				return self;
			};
			self.sync = function(opt){
				if(opt.channel){
					$dd.sub(opt.channel, function(obj){
						if(!opt.key || !obj.hasOwnProperty(opt.key) || !self.hasOwnProperty(opt.key))
							return;
						var o_id = _cleanRead(obj,opt.key),
							s_id = _cleanRead(self,opt.key);
						if(!o_id || !s_id || o_id != s_id)
							return;
						self.serialize(obj.serialize());
					});
				}

				var _pre = [],
					_post = [];
				self.loading = ko.observable(false);
				self.pre_save = function(fun){
					if(fun){
						if(!$dd.type(fun,'function'))
							return;
						_pre.push(fun);
						return self;
					}
					var fine = true,
						ni;
					for(ni = 0; ni < _pre.length; ni++){
						fine = fine && _pre[ni](self);
					}
					return fine;
				};
				self.save = function(){
					if(!self.pre_save()) return;

					if(!opt.api && !opt.channel)
						return;
					if(!opt.api){
						$dd.pub(opt.channel,self);
						return;
					}
					self.loading(true);
					opt.api(self.serialize(),function(resp){
						self.loading(false);
						self.post_save();
						$dd.pub(opt.channel,self);
					});
				};
				self.post_save = function(fun){
					if(fun){
						if(!$dd.type(fun,'function'))
							return;
						_post.push(fun);
						return self;
					}
					var fine = true,
						ni;
					for(ni = 0; ni < _post.length; ni++){
						fine = fine && _post[ni](self);
					}
					return fine;
				};

				return self;
			};

			//initialization
			return self.extend(def);
		};
	})()
});

// $dd.route
//		LETS DO SOME SINGLE PAGE APPS!
$dd.mixin({
	// before you get all crazy, this just exposes one function that allows one
	// to set up callbacks for when the page is navigated to a hash
	// as well as when it's leaving a hash. also lets you pass variables to the
	// open function by setting up your path.
	// path:  /beans/:id/:username?/cool has an optional username param and always
	//			passes an id to the open function. beans and cool are static
	route : (function(){
		var paths = {},
			current = null;

		function handleChange(){
			var hash = window.location.hash.replace(/^#!?\//,''),
				ni,no,args;

			for(ni in paths){
				if(!paths[ni].regexp.test(hash)) continue;
				if(ni === '' && hash.length) continue;
				if(hash === current) continue;

				if(paths[current]){
					for(no = 0; no < paths[current].after.length; no++){
						if(typeof paths[current].after[no] == 'function')
							paths[current].after[no]();
					}
				}

				args = paths[ni].regexp.exec(hash).splice(1);
				for(no = 0; no < paths[ni].before.length; no++){
					paths[ni].before[no].apply(null,args);
				}
				current = ni;
			}
		}

		window.addEventListener('hashchange',handleChange,false);
		$dd.init(function(){ handleChange(); });

		return function(path,open,close){
			keys = [];
			path = path
				.replace(/\/\(/g, '(?:/')
				.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
					keys.push({ name: key, optional: !! optional });
					slash = slash || '';
					return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
				})
				.replace(/([\/.])/g, '\\$1')
				.replace(/\*/g, '(.*)');
			if(!paths[path])
				paths[path] = {
					regexp: new RegExp(path),
					keys: keys,
					before: [],
					after: []
				};
			if(typeof open == 'function')
				paths[path].before.push(open);
			if(typeof close == 'function')
				paths[path].after.push(close);
		};
	})()
});

// $dd.dom
//		A dom navigator. Experimental. But jquery can crash
//		your phone. So make it better.
$dd.mixin({
	dom : (function(){
		//querySelectorAll Polyfill
		document.querySelectorAll = document.querySelectorAll||function(selector){
			var doc = document,
			head = doc.documentElement.firstChild,
			styleTag = doc.createElement('style');
			head.appendChild(styleTag);
			doc._qsa = [];

			styleTag.styleSheet.cssText = selector + "{x:expression(document._qsa.push(this))}";
			window.scrollBy(0, 0);

			return doc._qsa;
		};
		//matchesSelector Polyfill
		Element.prototype.matchesSelector = Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || function(selector){
			var els = document.querySelectorAll(selector),
				ni,len;
			for(ni=0, len=els.length; ni<len; ni++ ){
				if(els[ni] == this)
					return true;
			}
			return false;
		};

		var events = {};

		var cleanSelector = function(selector,_context){
			if(!selector.length)
				return [];
			var sels = selector.split(','),
				context = _context||document,
				res = [],
				ni,idpos,ctx;
			for(ni = 0; ni < sels.length; ni++){
				idpos = sels[ni].lastIndexOf('#');
				ctx = context;
				if(idpos > 0){
					ctx = document.getElementById(sels[ni].substr(idpos).match(/^#[^\s]*/)[0]);
					sels[ni] = sels[ni].substr(idpos).replace(/^#[^\s]*[\s]*/,'');
				}
				if(!sels[ni].length) continue;
				res = res.concat(Array.prototype.slice.call(ctx.querySelectorAll(sels[ni]),0));
			}

			return res;
		};

		var cssCap = function(a,x){ return x.toUpperCase(); };

		var _css = function(dom,obj){
			if($dd.type(obj,'string'))
				return dom[0].style[obj.replace(/-(\w)/g,cssCap)];

			var ni,no;
			for(ni = 0; ni < dom._len; ni++){
				for(no in obj)
					dom[ni].style[no.replace(/-(\w)/g,cssCap)] = obj[no];
			}
			return dom;
		},
		_addClass = function(dom,selector){
			var sels = selector.split(','),
				len = dom._len,
				ni,no;

			dom.removeClass(selector);

			for(ni = 0; ni < len; ni++){
				for(no = 0; no < sels.length; no++)
					dom[ni].className += ' ' + sels[no].replace(/(^\s*|\s*$)/g,'');
			}

			return dom;
		},
		_removeClass = function(dom,selector){
			var sels = selector.split(','),
				len = dom._len,
				ni,no,cname;
			for(ni = 0; ni < len; ni++){
				cname = ' ' + dom[ni].className.replace(/\s+/g,' ');
				for(no = 0; no < sels.length; no++)
					cname = cname.replace(new RegExp('\\s' + sels[no].replace(/(^\s*|\s*$)/g,''),'g'),'');
				dom[ni].className = cname.slice(1);
			}

			return dom;
		},
		_matches = function(dom,selector){
			var has = false,
				ni;
			for(ni = 0; ni < dom._len; ni++){
				has = has || !!dom[ni].matchesSelector(selector);
			}
			return has;
		},
		_find = function(dom,selector){
			return DomObj(selector,dom);
		},
		_closest = function(dom,selector){
			var elems = [],
				cap = document.documentElement,
				ni,no,len,curr,found;

			if(typeof selector != 'string' && !selector.hasOwnProperty('_len'))
				throw new Error('invalid selector passed to $dd.dom.closest');

			for(ni = 0; ni < dom._len; ni++){
				curr = dom[ni];
				while(curr != cap){
					if(typeof selector != 'string'){
						found = false;
						for(no = 0; no < selector._len; no++){
							if(curr != selector[no]) continue;
							found = true;
							break;
						}
						if(found) break;
					} else if(curr.matchesSelector(selector)) break;

					try {
						curr = curr.parentNode;
					} catch(e){
						console.log(selector);
						console.log(curr);
						throw e;
					}
				}
				if(curr == cap) continue;
				elems.push(curr);
			}
			len = elems.length;
			for(ni = 0; ni < len; ni++){
				for(no = ni+1; no < len;no++){
					if(elems[ni]!=elems[no]) continue;
					elems.splice(no--,1);
					len--;
				}
			}

			curr = DomObj(null,this);
			len = curr._len = elems.length;
			for(ni = 0; ni < len; ni++)
				curr[ni] = elems[ni];
			return curr;
		},
		_remove = function(dom){
			var ni,len;
			for(ni = 0, len = this._len; ni < len; ni++){
				if(!dom[ni].parentNode) continue;
				dom[ni].parentNode.removeChild(dom[ni]);
			}
			return dom;
		},
		_before = function(dom,elem){
			var ni, no;
			if(!elem.hasOwnProperty('_len'))
				elem = $dd.dom(elem);
			for(ni = 0; ni < dom._len; ni++){
				if(!dom[ni].parentNode) continue;
				for(no = 0; no < elem._len; no++){
					dom[ni].parentNode.insertBefore(elem[no],dom[ni]);
				}
			}
			return dom;
		},
		_after = function(dom,elem){
			var ni, no;
			if(!elem.hasOwnProperty('_len'))
				elem = $dd.dom(elem);
			for(ni = 0; ni < dom._len; ni++){
				if(!dom[ni].parentNode) continue;
				for(no = 0; no < elem._len;no++)
					dom[ni].parentNode.insertBefore(elem[no],dom[ni].nextSibling);
			}
		},
		_measure = function(dom){
			var box = dom[0].getBoundingClientRect();
			if(!box)
				return { top: 0, left: 0, width: 0, height: 0 };
		
			var body = dom[0].ownerDocument.body,
				clientTop  = document.documentElement.clientTop  || body.clientTop  || 0,
				clientLeft = document.documentElement.clientLeft || body.clientLeft || 0,
				scrollTop  = window.pageYOffset || document.documentElement.scrollTop  || body.scrollTop,
				scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || body.scrollLeft,
				top  = box.top  + scrollTop  - clientTop,
				left = box.left + scrollLeft - clientLeft;
		
			return {
				top: top,
				left: left,
				width: box.right - box.left,
				height: box.bottom - box.top
			};
		};

		var DomObj = function(selector, context){
			var self = {
				_back: null,
				_len: 0,
				_selector: ''
			};

			//some static functions
			self.css = function(obj){ return _css(self,obj); };
			self.addClass = function(selector){ return _addClass(self,selector); };
			self.removeClass = function(selector){ return _removeClass(self, selector); };
			self.matches = function(selector){ return _matches(self,selector); };
			self.find = function(selector){ return _find(self,selector); };
			self.closest = function(selector){ return _closest(self,selector); };
			self.remove = function(){ return _remove(self); };
			self.back = function(){ return self._back; };
			self.length = function(){ return self._len; };
			self.get = function(index){
				if(index < 0 || index > self._len)
					return;
				return DomObj(self[index],self);
			};
			self.before = function(elem){ return _before(self,elem); };
			self.after = function(elem){ return _after(self,elem); };
			self.html = function(str){
				if(!arguments.length)
					return self[0].innerHTML||'';
				var ni;
				for(ni = 0; ni < self._len; ni++){
					self[ni].innerHTML = str;
				}
				return self;
			};
			self.append = function(elem){
				if($dd.type(elem,'string')){
					elem = $dd.dom(elem);
				}
				var ni,no;
				for(ni = 0; ni < self._len; ni++){
					for(no = 0; no < elem._len; no++)
						self[ni].appendChild(elem[no]);
				}
			};
			self.measure = function(){
				return _measure(self);
			};
			self.on = function(evt,fun){
				if(!events[evt]){
					events[evt] = (function(){
						var s = {
							evt: evt,
							fun: null,
							routes: []
						};
						s.fun = function(_e){
							var t = $dd.dom(_e.target),
								ni,na;
							for(ni = 0; ni < s.routes.length; ni++){
								na = t.closest(s.routes[ni].dom);
								if(!na.hasOwnProperty('_len')||!na._len){
									continue;
								}
								s.routes[ni].callback(_e);
							}
						};
						return s;
					})();

					if(window.addEvent){
						window.addEvent('on'+evt, events[evt].fun);
					} else if(window.addEventListener){
						if(evt == 'scroll'){
							window.addEventListener('mousewheel',events[evt].fun,false);
							window.addEventListener('DOMMouseScroll',events[evt].fun,false);
						} else {
							window.addEventListener(evt,events[evt].fun,false);
						}
					}
				}

				events[evt].routes.push({ dom: self, callback: fun });
			};
			self.off = function(evt,fun){
				if(!events[evt] || !events[evt].routes.length) return;
				var r = events[evt].routes, ni;
				for(ni = r.length; ni > 0;){
					if(r[--ni].dom != self) continue;
					if(fun && r[ni].callback != fun) continue;
					r.splice(ni,1);
				}
			};
			self.delay = function(time){
				var funs = [],
					ret = {},
					ni;
				for(ni in this){
					if(/^(_|init)/.test(ni)) continue;
					ret[ni] = (function(ctx,name){
						return function(){
							funs.push({
								args: arguments,
								ctx: ctx,
								name: name
							});
						};
					})(this,ni);
				}
				setTimeout(function(){
					for(ni = 0; ni < funs.length; ni++){
						if(typeof funs[ni].ctx[funs[ni].name] != 'function')
							continue;
						funs[ni].ctx[funs[ni].name].apply(funs[ni].ctx,funs[ni].args);
					}
				},time);
				return ret;
			};

			self._back = context;
			if(!selector) return self;
			if($dd.type(selector,'node')){
				self[0] = selector;
				self._len = 1;
				return self;
			}
			if(/^[^<]*(<[\w\W]+>)[^>]*$/.test(selector)){
				var elem = document.createElement('div'),
					no,c;
				elem.innerHTML = selector.replace(/(^\s*|\s*$)/g,'');
				c = elem.childNodes;
				self._len = c.length;
				for(no = 0; no < self._len; no++){
					self[no] = c[no];
				}
				return self;
			}
			//need to add ability to create element or take normal element
			self._selector = selector;

			if(!selector) return self;

			var res = [],ni;
			if(context && context._len){
				for(ni = 0; ni < context._len; ni++){
					res = res.concat(cleanSelector(selector,context[ni]));
				}
			} else {
				res = cleanSelector(selector);
			}
			for(ni = 0; ni < res.length; ni++){
				self[ni] = res[ni];
			}
			self._len = res.length;

			return self;
		};

		return function(selector){
			return DomObj(selector);
		};
	})()
});

// $dd.touch
//		Browsers crapped on making themselves touch compatible
//		why should you suffer?
$dd.mixin({
	istouch: !!('ontouchend' in document),
	touch : function(options){
		var self = {
			touches: {},
			throttle: null,
			options: $dd.extend({
				element: $dd.dom(window),
				start: null,
				move: null,
				end: null
			},options)
		};

		self.start = function(evt){
			evt.preventDefault();
			var count = Object.keys(self.touches).length,
				win = $dd.dom(window),
				ni, touch;
			if($dd.istouch){
				for(ni = 0; ni < evt.changedTouches.length; ni++){
					touch = evt.changedTouches[ni];
					if(self.touches[touch.identifier]) return;
					self.touches[touch.identifier] = touch;
					if(!$dd.type(self.options.start,'function')) continue;
					self.options.start({
						id: touch.identifier,
						target: $dd.dom(touch.target),
						pageX: touch.pageX,
						pageY: touch.pageY
					});
				}
			} else {
				self.touches[0] = evt;
				if($dd.type(self.options.start,'function'))
					self.options.start({
						id: 0,
						target: $dd.dom(evt.target),
						pageX: evt.pageX,
						pageY: evt.pageY
					});
			}


			if(count === 0 && $dd.istouch){
				//win.on('touchmove', self.move);
				//win.on('touchend', self.end);
				//win.on('touchcancel', self.end);

				window.addEventListener('touchmove', self.move, false);
				window.addEventListener('touchend', self.end, false);
				window.addEventListener('touchcancel', self.end, false);
				self.evts = {};
			} else if(!$dd.istouch){
				//win.on('mousemove', self.move);
				//win.on('mouseup', self.end);
				window.addEventListener('mousemove', self.move, false);
				window.addEventListener('mouseup', self.end, false);
			}

			return false;
		};
		self.move = function(evt){
			var ni, touch;
			evt.preventDefault();
			if(!$dd.istouch){
				self.evts = { 0:evt };
			} else {
				for(ni = 0; ni < evt.touches.length; ni++){
					touch = evt.touches[ni];
					if(!self.touches[touch.identifier]) continue;
					self.touches[touch.identifier] = touch;
					self.evts[touch.identifier] = touch;
				}
			}

			if(self.throttle)
				return;

			var t = function(){
				var no;
				for(no in self.touches){
					if(!self.evts[no]) continue;
					if($dd.type(self.options.move,'function'))
						self.options.move({
							id: no,
							target: $dd.dom(self.evts[no].target),
							pageX: self.evts[no].pageX,
							pageY: self.evts[no].pageY
						});
				}
				self.evts = {};
			};

			self.throttle = setInterval(t,50);
			t();
		};
		self.end = function(evt){
			var win = $dd.dom(window),
				touch, ni;
			if(!$dd.istouch){
				if($dd.type(self.options.end,'function'))
					self.options.end({
						id: 0,
						target: evt.target,
						pageX: evt.pageX,
						pageY: evt.pageY
					});
				delete self.touches[0];
			} else {
				for(ni = 0; ni < evt.changedTouches.length; ni++){
					touch = evt.changedTouches[ni];
					if(!self.touches[touch.identifier]) return;
					if($dd.type(self.options.end,'function'))
						self.options.end({
							id: touch.identifier,
							target: $dd.dom(touch.target),
							pageX: evt.pageX,
							pageY: evt.pageY
						});
					delete self.touches[touch.identifier];
				}
			}

			if(Object.keys(self.touches).length) return;

			if($dd.istouch){
				//win.off('touchmove', self.move);
				//win.off('touchend', self.end);
				//win.off('touchcancel', self.end);

				window.removeEventListener('touchmove', self.move);
				window.removeEventListener('touchend', self.end);
				window.removeEventListener('touchcancel', self.end);
			} else {
				//win.off('mousemove', self.move);
				//win.off('mouseup', self.end);

				window.removeEventListener('mousemove', self.move);
				window.removeEventListener('mouseup', self.end);
			}

			self.touches = {};
			self.evts = {};
			if(self.throttle){
				clearInterval(self.throttle);
				self.throttle = null;
			}
		};
		self.remove = function(){
			var win = $dd.dom(window);
			if(!$dd.istouch){
				self.options.element.off('mousedown', this.start);
				//win.off('mousemove', this.move);
				//win.off('mouseup', this.end);
				window.removeEventListener('mousemove', self.move);
				window.removeEventListener('mouseup', self.end);
				return;
			}

			self.options.element.off('touchstart', this.start);
			//win.off('touchmove', this.move);
			//win.off('touchend', this.end);
			//win.off('touchcancel', this.end);
			window.removeEventListener('touchmove', self.move);
			window.removeEventListener('touchend', self.end);
			window.removeEventListener('touchcancel', self.end);
		};

		self.options.element.on($dd.istouch?'touchstart':'mousedown', self.start);
		return self;
	}
});

// $dd.keys
//		Why not add some hotkey bindings?
$dd.mixin((function(){
	var keyStatus = {},
		keyMap = {},
		add = function(evt){
			var code = evt.which ? evt.which : event.keyCode,
				ni;
			keyStatus[code] = true;

			for(ni in keyMap){
				keyMap[ni].check(code);
			}
		},
		remove = function(evt){
			var code = evt.which ? evt.which : event.keyCode;
			delete keyStatus[code];
		},
		translate = function(str){
			str = str.toLowerCase();
			if(/(ctrl|alt|shift|tab|enter|left|right|up|down)/.test(str)){
				switch(str){
					case 'ctrl': return 17;
					case 'alt': return 18;
					case 'shift': return 16;
					case 'tab': return 9;
					case 'enter': return 13;
					case 'left': return 37;
					case 'right': return 39;
					case 'up': return 38;
					case 'down': return 40;
				}
			}
			return str.toUpperCase().charCodeAt(0);
		},
		sequence = function(str,callback){
			var delay = 500,
				inter = null;

			var self = {
					pointer: 0,
					seq: [],
					callback: callback
				},
				mreg = /(\[[^\]]*\]\[[^\]]*\])/g,
				modifiers = str.match(mreg),
				result = str.replace(mreg,'&').split('+'),
				out = [],
				ni, no, mod, key;

			for(ni = 0; ni < result.length; ni++){
				result[ni] = result[ni].replace(/\s+/g,'');
				if(result[ni] != '&'){
					self.seq.push({ key: translate(result[ni]) });
					continue;
				}
				mod = modifiers.shift();
				mod = mod.replace(/\]\[/g,'&').replace(/[\[\]]/g,'').split('&');
				key = mod[1].split('+');
				mod = mod[0].split('+');
				for(no = 0; no < mod.length; no++)
					mod[no] = translate(mod[no]);
				for(no = 0; no < key.length; no++)
					self.seq.push({ key: translate(key[no]), state: mod });
			}

			self.check = function(key){
				var curr = self.seq[self.pointer],
					ni, valid, init;
				//normalize numpad
				if(key > 95 && key < 106)
					key -= 48;

				if(curr.state){
					valid = true;
					init = false;
					for(ni = 0; ni < curr.state.length; ni++){
						if(curr.state[ni] == key)
							init = true;
						valid = valid && keyStatus[curr.state[ni]];
					}

					//a modifier must be pressed before being applied
					if(init){
						return self.reset();
					}

					if(!valid || key != curr.key){
						return self.clear();
					}
				} else if(key != curr.key){
					return self.clear();
				}

				if(self.pointer < self.seq.length - 1){
					self.pointer++;
					return self.reset();
				}
				if($dd.type(self.callback,'function'))
					self.callback();
				self.clear();
				return true;
			};
			self.reset = function(){
				if(inter)
					clearTimeout(inter);
				inter = setTimeout(self.clear,delay);
				return false;
			};
			self.clear = function(){
				if(!inter) return;
				clearTimeout(inter);
				inter = null;
				self.pointer = 0;
				return false;
			};
			return self;
		};

	$dd.init(function(){
		//var win = $dd.dom(window);
		//win.on('keydown',add);
		//win.on('keyup',remove);
		window.addEventListener('keydown',add, false);
		window.addEventListener('keyup',remove, false);
	});


	return {
		keys: function(map){
			for(var ni in map){
				keyMap[ni] = sequence(ni,map[ni]);
			}
		}
	};
})());

// $dd.api:
//		Basic structure for normalizing ajax calls
$dd.mixin({
	api : (function(config){
		function postString(obj, prefix){
			var str = [], p, k, v;
			if($dd.type(obj,'array')){
				if(!prefix)
					throw new Error('Sorry buddy, your object is wrong and you should feel bad');
				for(p = 0; p < obj.length; p++){
					k = prefix + "[" + p + "]";
					v = obj[p];
					str.push(typeof v == "object"?postString(v,k):encodeURIComponent(k) + "=" + encodeURIComponent(v));
				}
			}
			for(p in obj) {
				if(prefix)
					k = prefix + "[" + p + "]";
				else
					k = p;
				v = obj[p];
				str.push(typeof v == "object"?postString(v,k):encodeURIComponent(k) + "=" + encodeURIComponent(v));
			}
			return str.join("&");
		}

		var self = {};

		self.raw = (function(){
			function xhr(options){
				var origin, parts, crossDomain, _ret;
				function createStandardXHR(){ try { return new window.XMLHttpRequest(); } catch(e){} }
				function createActiveXHR(){ try { return new window.ActiveXObject("Microsoft.XMLHTTP"); } catch(e){} }
				function createJSONP(){
					function randomer(){
						var s=[],itoh = '0123456789ABCDEF',i;

						for(i = 0; i < 16; i++){
							s[i] = i==12?4:Math.floor(Math.random()*0x10);
							if(i==16) s[i] = (s[i]&0x3)|0x8;
							s[i] = itoh[s[i]];
						}
						return s.join('');
					}

					var ret = {
						_options: {
							key: '',
							url: '',
							script: null,
							mime: 'json'
						},
						readyState: 0,
						onreadystatechange: null,
						response: null,
						responseText: null,
						responseXML: null,
						responseType: '',

						status: null,
						statusText: '',
						timeout: 0,

						upload: null
					};

					ret.abort = function(){
						if(ret.readyState != 3) return;
						ret._options.script.parentNode.removeChild(ret._options.script);
						$dd.api[ret._options.key] = function(){
							delete $dd.api[ret._options.key];
						};

						ret.readyState = 1;
						if(typeof ret.onreadystatechange == 'function')
							ret.onreadystatechange();
					};
					ret.getAllResponseHeaders = function(){};
					ret.getResponseHeader = function(header){};
					ret.open = function(method,url,async,user,pass){
						//method is always get, async is always true, and user/pass do nothing
						//they're still there to provide a consistant interface
						ret._options.url = url;
						ret._options.script = document.createElement('script');
						ret._options.script.type = 'text/javascript';
						ret.readyState = 1;
						if(typeof ret.onreadystatechange == 'function')
							ret.onreadystatechange();

						document.head.appendChild(ret._options.script);
					};
					//this does nothing
					ret.overrideMimeType = function(mime){};
					ret.send = function(data){
						ret._options.key = 'jsonp_'+randomer();

						var _data = postString(data),
							url = ret._options.url;
						url += (url.indexOf('?') == -1?'?':'&');
						url += 'callback=$dd.api.'+ret._options.key;

						if(_data.length)
							url += '&'+_data;

						$dd.api[ret._options.key] = function(data){
							if(!$dd.type(data,'string'))
								data = JSON.stringify(data);
							ret.responseText = data;
							ret.response = data;
							ret.readyState = 4;
							ret.status = 200;
							if(typeof ret.onreadystatechange == 'function')
									ret.onreadystatechange();
							ret._options.script.parentNode.removeChild(ret._options.script);

							delete $dd.api[ret._options.key];
						};
						ret.readyState = 3;
						if(typeof ret.onreadystatechange == 'function')
							ret.onreadystatechange();
						ret._options.script.src = url;
					};

					//this does nothing
					ret.setRequestHeader = function(header, value){};

					return ret;
				}

				try {
					origin = location.href;
				} catch(e){
					origin = document.createElement( "a" );
					origin.href = "";
					origin = origin.href;
				}

				origin = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/.exec(origin.toLowerCase());
				options.url = (( options.url ) + "").replace(/#.*$/, "").replace(/^\/\//, origin[1] + "//");
				parts  = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/.exec(options.url.toLowerCase());

				if(!parts.length || parts.length < 3)
					throw new Error('$dd.api: invalid url supplied to xhr');

				origin[3] = origin[3]||(origin[1]=='http:'?'80':'443');
				parts[3] = parts[3]||(parts[1]=='http:'?'80':'443');

				crossDomain = !!(parts &&
					( parts[1] !== origin[1] ||
						parts[2] !== origin[2] ||
						parts[3] != origin[3]
					)
				);

				_ret = window.ActiveXObject ?
					function() {
						return !/^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(origin[1]) && createStandardXHR() || createActiveXHR();
					} : createStandardXHR;
				_ret = _ret();

				if(!_ret || (crossDomain && !_ret.hasOwnProperty('withCredentials')))
					_ret = createJSONP();

				return _ret;
			}

			function ajax(params){
				params = $dd.extend({
					url: '',
					method: 'GET',
					type: 'json',
					async: 'true',
					timeout: 0,
					data: null,

					succes: null,
					error: null
				},params);
				console.log(params);
				var _xhr = xhr(params);
				if(params.method == 'GET')
					params.url += '?' + postString(params.data);
				_xhr.open(params.method,params.url,params.async);
				_xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
				_xhr.responseType = params.type;
				_xhr.onreadystatechange = function(){
					if(_xhr.readyState != 4) return;
					if(_xhr.status != 200 && typeof params.error == 'function')
						params.error(_xhr.response);
					if(_xhr.status == 200 && typeof params.success == 'function')
						params.success(_xhr.response);
				};
				_xhr.send(params.method=='POST'?postString(params.data):null);
				return _xhr;
			}

			return function(url,data,callback,method){
				return ajax({
					method: method||'GET',
					url: url,
					data: data,
					success: function(result){
						if($dd.type(callback,'function'))
							callback(result);
					}
				});
			};
		})();

		// if you're going to be using pre and post filters on the data
		// make sure you return true to continue the chain, or return
		// false to cancel it
		self.route = function(name,url,pre,post,method){
			name = name.trim();
			pre = pre||function(data){ return true; };
			post = post||function(data){ return true; };

			if(/^(route|raw|config)$/.test(name))
				throw new Error('invalid name sent to $dd.api.route');

			self[name] = function(params,callback){
				if(!pre(params)) return;
				self.raw(url,params,function(data){
					if(post(data) && $dd.type(callback,'function'))
						callback(data);
				},method||'GET');
			};
		};

		return self;
	})()
});
