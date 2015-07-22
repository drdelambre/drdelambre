// $dd.dom
//		A dom navigator. Experimental. But jquery can crash your phone
//		and is getting fatter all the time. So make it better.
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define([
			'../dd',
			'../polyfill/querySelector',
			'../polyfill/matchesSelector',
			'../polyfill/animationFrame'
		], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('../dd'));
		require('../polyfill/querySelector');
		require('../polyfill/matchesSelector');
		require('../polyfill/animationFrame');
	} else {
		factory($dd);
	}
})(function(lib){
	if(lib.hasOwnProperty('dom')){
		return;
	}
	var cleanSelector = function(selector,_context){
		if(!selector.length){
			return [];
		}
		var sels = selector.split(','),
			context = _context||window.document,
			res = [],
			ni,idpos,ctx;
		for(ni = 0; ni < sels.length; ni++){
			idpos = sels[ni].lastIndexOf('#');
			ctx = context;
			if(idpos > 0){
				ctx = window.document.getElementById(sels[ni].substr(idpos).match(/^#[^\s]*/)[0]);
				sels[ni] = sels[ni].substr(idpos).replace(/^#[^\s]*[\s]*/,'');
			}
			if(!sels[ni].length){
				continue;
			}
			res = res.concat(Array.prototype.slice.call(ctx.querySelectorAll(sels[ni]),0));
		}

		return res;
	};

	var cssCap = function(a,x){ return x.toUpperCase(); };

	var events = {},
		fn = {
			css: function(dom,obj){
				if(lib.type(obj,'string')){
					var val = window.document.defaultView.getComputedStyle(dom[0])[obj.replace(/-(\w)/g,cssCap)];
					if(lib.type(val,'undefined')||val === 'none'){
						return;
					}
					if(!isNaN(parseFloat(val))){
						return parseFloat(val);
					}
					if(/^matrix\(/i.test(val)){
						var primitives = val.match(/(-?\d*\.?\d+)/g);
						val = {};
						if(primitives.length === 6){
							val.translateX = parseFloat(primitives[4]);
							val.translateY = parseFloat(primitives[5]);
							val.rotation = Math.atan(primitives[1]/primitives[3]);
							val.scaleX = primitives[0]/Math.cos(val.rotation);
							val.scaleY = primitives[3]/Math.cos(val.rotation);
						}
					}
					return val;
				}

				var ni,no;
				for(ni = 0; ni < dom._len; ni++){
					for(no in obj){
						dom[ni].style[no.replace(/-(\w)/g,cssCap)] = obj[no];
					}
				}

				return dom;
			},
			addClass: function(dom,selector){
				var sels = selector.split(','),
					len = dom._len,
					ni,no;

				dom.removeClass(selector);

				for(ni = 0; ni < len; ni++){
					for(no = 0; no < sels.length; no++){
						dom[ni].className += ' ' + sels[no].replace(/(^\s*|\s*$)/g,'');
					}
				}

				return dom;
			},
			removeClass: function(dom,selector){
				var sels = selector.split(','),
					len = dom._len,
					ni,no,cname;
				for(ni = 0; ni < len; ni++){
					cname = ' ' + dom[ni].className.replace(/\s+/g,' ');
					for(no = 0; no < sels.length; no++){
						cname = cname.replace(new RegExp('\\s' + sels[no].replace(/(^\s*|\s*$)/g,''),'g'),'');
					}
					dom[ni].className = cname.slice(1);
				}

				return dom;
			},
			matches: function(dom,selector){
				var ni,no;
				if(!lib.type(selector,'string')){
					selector = lib.dom(selector);
				}

				for(ni = 0; ni < dom._len; ni++){
					if(dom[ni] === window){
						if((lib.type(selector,'string') && selector === 'window') || selector[0] === window){
							return true;
						}
					} else if(selector.hasOwnProperty('_len')){
						for(no = 0; no < selector._len;no++){
							if(dom[ni] !== selector[no]){
								continue;
							}
							return true;
						}
					} else if(!!dom[ni].matchesSelector(selector)){
						return true;
					}
				}
				return false;
			},
			find: function(dom,selector){
				return DomObj(selector,dom);
			},
			__closest: function(dom,selector){
				var elems = [],
					cap = window.document.documentElement,
					ni,no,len,curr,depth,found;

				if(typeof selector !== 'string' && !selector.hasOwnProperty('_len')){
					throw new Error('invalid selector passed to $dd.dom.closest');
				}

				for(ni = 0; ni < dom._len; ni++){
					curr = dom[ni];
					while(curr !== cap){
						if(typeof selector !== 'string'){
							found = false;
							for(no = 0; no < selector._len; no++){
								if(selector[no] !== window && curr !== selector[no]){
									continue;
								}
								found = true;
								break;
							}
							if(found){
								break;
							}
						} else if(curr.matchesSelector(selector)){
							break;
						}
						if(!curr.parentNode){
							curr = cap;
							break;
						}
						curr = curr.parentNode;
					}
					if(curr === cap){
						continue;
					}
					elems.push(curr);
				}
				len = elems.length;
				for(ni = 0; ni < len; ni++){
					for(no = ni+1; no < len;no++){
						if(elems[ni] !== elems[no]){
							continue;
						}
						elems.splice(no--,1);
						len--;
					}
				}
				return elems;
			},
			closest: function(dom,selector){
				var elems = fn.__closest(dom,selector),
					len, ni;

				var curr = DomObj(null,dom);

				if(!elems.length){
					return curr;
				}

				len = curr._len = elems.length;
				for(ni = 0; ni < len; ni++){
					curr[ni] = elems[ni];
				}
				return curr;
			},
			remove: function(dom){
				var ni,len;
				for(ni = 0, len = dom._len; ni < len; ni++){
					if(!dom[ni].parentNode){
						continue;
					}
					dom[ni].parentNode.removeChild(dom[ni]);
				}
				return dom;
			},
			delay: function(dom,time){
				var funs = [],
					ret = {},
					ni;
				var delay = function(ctx,name){
					var _ret = function(){
						funs.push({
							args: arguments,
							ctx: ctx,
							name: name
						});
						return ret;
					};

					return _ret;
				};

				for(ni in dom){
					if(/^(_|init)/.test(ni)){
						continue;
					}
					ret[ni] = delay(dom,ni);
				}

				dom._pending++;

				var time_func = function(){
					for(ni = 0; ni < funs.length; ni++){
						if(typeof funs[ni].ctx[funs[ni].name] !== 'function'){
							continue;
						}
						dom = funs[ni].ctx[funs[ni].name].apply(dom,funs[ni].args);
					}
					if(--dom._pending <= 0 && dom._done.length){
						for(ni = 0; ni < dom._done.length; ni++){
							dom._done[ni](dom);
						}
					}
				};

				if(window._phantom){
					setTimeout(function(){
						setTimeout(time_func,time);
					},1);
				} else {
					setTimeout(time_func,time);					
				}

				return ret;
			},
			done: function(dom,callback){
				if(!lib.type(callback,'function')){
					return dom;
				}
				if(dom._pending > 0){
					dom._done.push(callback);
				} else {
					callback(dom);
				}
				return dom;
			},
			before: function(dom,elem){
				if(!elem){
					return dom;
				}

				var ni, no;
				if(!elem.hasOwnProperty('_len')){
					elem = lib.dom(elem);
				}
				for(ni = 0; ni < dom._len; ni++){
					if(!dom[ni].parentNode){
						continue;
					}
					for(no = 0; no < elem._len; no++){
						dom[ni].parentNode.insertBefore(elem[no],dom[ni]);
					}
				}
				return dom;
			},
			after: function(dom,elem){
				if(!elem){
					return dom;
				}

				var ni, no;
				if(!elem.hasOwnProperty('_len')){
					elem = lib.dom(elem);
				}
				for(ni = 0; ni < dom._len; ni++){
					if(!dom[ni].parentNode){
						continue;
					}
					for(no = 0; no < elem._len;no++){
						dom[ni].parentNode.insertBefore(elem[no],dom[ni].nextSibling);
					}
				}

				return dom;
			},
			next: function(dom,selector){
				if(!dom[0]){
					return DomObj();
				}
				var curr = dom[0].nextSibling;
				while(curr){
					if(!lib.type(curr,'node') || (selector && !DomObj(curr).matches(selector))){
						curr = curr.nextSibling;
						continue;
					}

					return DomObj(curr);
				}

				return DomObj();
			},
			nextAll: function(dom,selector){
				var out = DomObj(),
					curr = dom.next(selector);
				while(curr._len){
					out[out._len] = curr[0];
					out._len ++;
					curr = curr.next(selector);
				}
				return out;
			},
			prev: function(dom,selector){
				if(!dom[0]){
					return DomObj();
				}
				var curr = dom[0].previousSibling;
				while(curr){
					if(!lib.type(curr,'node') || (selector && !DomObj(curr).matches(selector))){
						curr = curr.previousSibling;
						continue;
					}

					return DomObj(curr);
				}

				return DomObj();
			},
			prevAll: function(dom,selector){
				var out = DomObj(),
					curr = dom.prev(selector);
				while(curr._len){
					out[out._len] = curr[0];
					out._len++;
					curr = curr.prev(selector);
				}
				return out;
			},
			clone: function(dom){
				var newDom = DomObj(),
					ni,no,temp,attr;
				newDom._selector = dom._selector;
				newDom._len = dom._len;
				for(ni = 0; ni < dom._len; ni++){
					temp = window.document.createElement(dom[ni].nodeName);
					attr = dom[ni].attributes;
					for(no = 0; no < attr.length; no++){
						temp.setAttribute(attr[no].name,attr[no].value);
					}
					temp.innerHTML = dom[ni].innerHTML;
					newDom[ni] = temp;
				}

				return newDom;
			},
			measure: function(dom){
				var box = dom[0].getBoundingClientRect();
				if(!box){
					return { top: 0, left: 0, width: 0, height: 0 };
				}
			
				var body = dom[0].ownerDocument.body,
					clientTop  = window.document.documentElement.clientTop  || body.clientTop  || 0,
					clientLeft = window.document.documentElement.clientLeft || body.clientLeft || 0,
					scrollTop  = window.pageYOffset || window.document.documentElement.scrollTop  || body.scrollTop,
					scrollLeft = window.pageXOffset || window.document.documentElement.scrollLeft || body.scrollLeft,
					top  = box.top  + scrollTop  - clientTop,
					left = box.left + scrollLeft - clientLeft,
					styles = window.document.defaultView.getComputedStyle(dom[0]),

					p_top = parseFloat(styles.getPropertyValue('padding-top')),
					p_bottom = parseFloat(styles.getPropertyValue('padding-bottom')),
					p_left = parseFloat(styles.getPropertyValue('padding-left')),
					p_right = parseFloat(styles.getPropertyValue('padding-right')),

					b_top = parseFloat(styles.getPropertyValue('border-top-width')),
					b_bottom = parseFloat(styles.getPropertyValue('border-bottom-width')),
					b_left = parseFloat(styles.getPropertyValue('border-left-width')),
					b_right = parseFloat(styles.getPropertyValue('border-right-width'));

				return {
					top: top,
					left: left,
					width: box.right - box.left,
					height: box.bottom - box.top,
					innerWidth: box.right - box.left - (b_left + b_right + p_left + p_right),
					innerHeight: box.bottom - box.top - (b_top + b_bottom + p_top + p_bottom),
					scrollWidth: dom[0].scrollWidth,
					scrollHeight: dom[0].scrollHeight,
					scrollLeft: dom[0].scrollLeft,
					scrollTop: dom[0].scrollTop
				};
			},
			get: function(dom,index){
				if(index < 0 || index > dom._len){
					return;
				}
				return DomObj(dom[index],dom);
			},
			length: function(dom){ return dom._len; },
			html: function(dom,str){
				if(lib.type(str,'undefined')){
					return dom[0].innerHTML||'';
				}
				for(var ni = 0; ni < dom._len; ni++){
					dom[ni].innerHTML = str;
				}
				return dom;
			},
			append: function(dom,elem){
				var ni,no;
				elem = lib.dom(elem);
				for(ni = 0; ni < dom._len; ni++){
					for(no = 0; no < elem._len; no++){
						dom[ni].appendChild(elem[no]);
					}
				}
				return dom;
			},
			prepend: function(dom,elem){
				var ni,no,a;
				elem = lib.dom(elem);
				for(ni = 0; ni < dom._len; ni++){
					a = dom[ni].firstChild;
					for(no = 0; no < elem._len; no++){
						dom[ni].insertBefore(elem[no],a);
					}
				}
				return dom;
			},
			on: function(dom,evt,fun){
				if(/^(focus|blur)$/.test(evt)){
					var _evt = window.addEvent?'on'+evt:evt,
						_list = window.addEvent?'addEvent':'addEventListener',
						ni;
					for(ni = 0; ni < dom._len; ni++){
						dom[ni][_list](_evt,fun);
					}

					return dom;
				}

				if(!events[evt]){
					events[evt] = (function(){
						var s = {
							evt: evt,
							fun: null,
							routes: []
						};
						s.fun = function(_e){
							/*
							if(s.evt === 'scroll'){
								var delta = 0,
									deltaX = 0,
									deltaY = 0,
									absDelta = 0;
								if('detail'      in _e ){
									deltaY = _e.detail * -1;
								}
								if('wheelDelta'  in _e ){
									deltaY = _e.wheelDelta;
								}
								if('wheelDeltaY' in _e ){
									deltaY = _e.wheelDeltaY;
								}
								if('wheelDeltaX' in _e ){
									deltaX = _e.wheelDeltaX * -1;
								}
								if('axis' in _e && _e.axis === _e.HORIZONTAL_AXIS){
									deltaX = deltaY * -1;
									deltaY = 0;
								}

								delta = deltaY === 0 ? deltaX : deltaY;

								if('deltaY' in _e){
									deltaY = _e.deltaY * -1;
									delta = deltaY;
								}
								if('deltaX' in _e){
									deltaX = _e.deltaX;

									if(deltaY === 0){
										delta = deltaX * -1;
									}
								}
								_e.deltaX = deltaX;
								_e.deltaY = deltaY;
							}
							*/
							var t = lib.dom(_e.target),
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
						if(evt === 'scroll'){
							window.addEventListener('onmousewheel',events[evt].fun,false);
						} else {
							window.addEvent('on'+evt, events[evt].fun);
						}
					} else if(window.addEventListener){
						if(evt === 'scroll'){
							window.addEventListener('wheel',events[evt].fun,false);
						} else {
							window.addEventListener(evt,events[evt].fun,false);
						}
					}
				}

				events[evt].routes.push({ dom: dom, callback: fun });
				return dom;
			},
			off: function(dom,evt,fun){
				if(!events[evt] || !events[evt].routes.length){
					return;
				}

				var r = events[evt].routes,
					ni,found=false;
				for(ni = r.length; ni > 0;){
					if(!dom.matches(r[--ni].dom)){
						continue;
					}
					if(fun && r[ni].callback !== fun){
						continue;
					}
					found = true;
					r.splice(ni,1);
				}

				return dom;
			},
			fire: function(dom,evt){
				function real_fire(obj,_evt){
					var evObj;
					if(window.document.createEvent){
						evObj = window.document.createEvent('MouseEvent');
						evObj.initMouseEvent(_evt, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						obj.dispatchEvent(evObj);
					} else if(window.document.createEventObject){
						evObj = window.document.createEventObject();
						obj.fireEvent('on' + _evt, evObj);
					}
				}

				for(var ni = 0; ni < dom._len; ni++){
					real_fire(dom[ni],evt);
				}

				return dom;
			},
			focus: function(dom){
				for(var ni = 0; ni < dom._len; ni++){
					if(/(input|textarea)/i.test(dom[ni].nodeName)){
						dom[ni].focus();
						return dom;
					}
				}
			},
			each: function(dom,callback){
				for(var ni = 0; ni < dom._len; ni++){
					callback(dom.get(ni),ni);
				}
				return dom;
			}
		};

	var DomObj = function(selector, context){
		var self = {
			_back: null,
			_len: 0,
			_selector: '',
			_pending: 0,
			_done: []
		};

		self.css = function(obj) { return fn.css(self, obj); };
		self.addClass = function(_selector) { return fn.addClass(self, _selector); };
		self.removeClass = function(_selector) { return fn.removeClass(self, _selector); };
		self.matches = function(_selector) { return fn.matches(self, _selector); };
		self.find = function(_selector) { return fn.find(self, _selector); };
		self.closest = function(_selector) { return fn.closest(self, _selector); };
		self.remove = function() { return fn.remove(self); };
		self.delay = function(time) { return fn.delay(self, time); };
		self.done = function(cb) { return fn.done(self, cb); };
		self.before = function(elem) { return fn.before(self, elem); };
		self.after = function(elem) { return fn.after(self, elem); };
		self.append = function(elem) { return fn.append(self, elem); };
		self.prepend = function(elem) { return fn.prepend(self, elem); };
		self.next = function(_selector) { return fn.next(self, _selector); };
		self.nextAll = function(_selector) { return fn.nextAll(self, _selector); };
		self.prev = function(_selector) { return fn.prev(self, _selector); };
		self.prevAll = function(_selector) { return fn.prevAll(self, _selector); };
		self.clone = function() { return fn.clone(self); };
		self.measure = function() { return fn.measure(self); };
		self.get = function(index) { return fn.get(self, index); };
		self.length = function() { return self._len; };
		self.html = function(string) { return fn.html(self, string); };
		self.on = function(evt, cb) { return fn.on(self, evt, cb); };
		self.off = function(evt, cb) { return fn.off(self, evt, cb); };
		self.fire = function(evt) { return fn.fire(self, evt); };
		self.focus = function() { return fn.focus(self); };
		self.each = function(cb) { return fn.each(self, cb); };


		self._back = context;

		if(!selector){
			return self;
		}

		if(lib.type(selector,'node')){
			self[0] = selector;
			self._len = 1;
			return self;
		}

		if(/^[^<]*(<[\w\W]+>)[^>]*$/.test(selector)){
			var elem = window.document.createElement('tbody'),
				no,c;
			elem.innerHTML = selector.replace(/(^\s*|\s*$)/g,'');
			c = Array.prototype.slice.call(elem.childNodes,0);
			self._len = c.length;
			for(no = 0; no < self._len; no++){
				c[no].parentNode.removeChild(c[no]);
				self[no] = c[no];
			}
			return self;
		}

		//need to add ability to create element or take normal element
		self._selector = selector;

		if(!selector){
			return self;
		}

		var res = [];
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

	var ret_func = function(selector){
		if(lib.type(selector,'object') && selector.hasOwnProperty('_len')){
			return selector;
		}
		return DomObj(selector);
	};

	ret_func.atPoint = function(x,y){
		return lib.dom(window.document.elementFromPoint(x,y));
	};

	lib.mixin({
		dom : ret_func
	});
});
