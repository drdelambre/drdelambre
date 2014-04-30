/* {"requires": ["dd","polyfill/querySelector","polyfill/matchesSelector"]} */
// $dd.dom
//		A dom navigator. Experimental. But jquery can crash your phone
//		and is getting fatter all the time. So make it better.
;(function($dd){
	var cleanSelector = function(selector,_context){
		if(!selector.length){
			return [];
		}
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
				if($dd.type(obj,'string')){
					var val = document.defaultView.getComputedStyle(dom[0])[obj.replace(/-(\w)/g,cssCap)];
					if($dd.type(val,'undefined')||val === 'none'){
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
				if(!$dd.type(selector,'string')){
					selector = $dd.dom(selector);
				}

				for(ni = 0; ni < dom._len; ni++){
					if(dom[ni] === window){
						if(($dd.type(selector,'string') && selector === 'window') || selector[0] === window){
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
					cap = document.documentElement,
					ni,no,len,curr,depth,found;

				if(typeof selector !== 'string' && !selector.hasOwnProperty('_len')){
					throw new Error('invalid selector passed to $dd.dom.closest');
				}

				for(ni = 0; ni < dom._len; ni++){
					curr = dom[ni];
					depth = 0;
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
						depth++;
						curr = curr.parentNode;
					}
					if(curr === cap){
						continue;
					}
					elems.push({ elem: curr, depth: depth });
				}
				len = elems.length;
				for(ni = 0; ni < len; ni++){
					for(no = ni+1; no < len;no++){
						if(elems[ni].elem !== elems[no].elem){
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
					curr[ni] = elems[ni].elem;
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
					return function(){
						funs.push({
							args: arguments,
							ctx: ctx,
							name: name
						});
					};
				};

				for(ni in dom){
					if(/^(_|init)/.test(ni)){
						continue;
					}
					ret[ni] = delay(dom,ni);
				}
				setTimeout(function(){
					for(ni = 0; ni < funs.length; ni++){
						if(typeof funs[ni].ctx[funs[ni].name] !== 'function'){
							continue;
						}
						funs[ni].ctx[funs[ni].name].apply(funs[ni].ctx,funs[ni].args);
					}
				},time);
				return ret;
			},
			before: function(dom,elem){
				var ni, no;
				if(!elem.hasOwnProperty('_len')){
					elem = $dd.dom(elem);
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
				var ni, no;
				if(!elem.hasOwnProperty('_len')){
					elem = $dd.dom(elem);
				}
				for(ni = 0; ni < dom._len; ni++){
					if(!dom[ni].parentNode){
						continue;
					}
					for(no = 0; no < elem._len;no++){
						dom[ni].parentNode.insertBefore(elem[no],dom[ni].nextSibling);
					}
				}
			},
			clone: function(dom){
				var newDom = DomObj(),
					ni,no,temp,attr;
				newDom._selector = dom._selector;
				newDom._len = dom._len;
				for(ni = 0; ni < dom._len; ni++){
					temp = document.createElement(dom[ni].nodeName);
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
					clientTop  = document.documentElement.clientTop  || body.clientTop  || 0,
					clientLeft = document.documentElement.clientLeft || body.clientLeft || 0,
					scrollTop  = window.pageYOffset || document.documentElement.scrollTop  || body.scrollTop,
					scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || body.scrollLeft,
					top  = box.top  + scrollTop  - clientTop,
					left = box.left + scrollLeft - clientLeft,
					styles = document.defaultView.getComputedStyle(dom[0]),

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
					innerHeight: box.bottom - box.top - (b_top + b_bottom + p_top + p_bottom)
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
				if($dd.type(str,'undefined')){
					return dom[0].innerHTML||'';
				}
				for(var ni = 0; ni < dom._len; ni++){
					dom[ni].innerHTML = str;
				}
				return dom;
			},
			append: function(dom,elem){
				var ni,no;
				elem = $dd.dom(elem);
				for(ni = 0; ni < dom._len; ni++){
					for(no = 0; no < elem._len; no++){
						dom[ni].appendChild(elem[no]);
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
						if(evt === 'scroll'){
							window.addEventListener('onmousewheel',events[evt].fun,false);
						} else {
							window.addEvent('on'+evt, events[evt].fun);
						}
					} else if(window.addEventListener){
						if(evt === 'scroll'){
							window.addEventListener('mousewheel',events[evt].fun,false);
							window.addEventListener('DOMMouseScroll',events[evt].fun,false);
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
			_selector: ''
		};

		//some static functions
		var ni;
		var apply_fns = function(dom,index){
			dom[index] = function(){
				var args = Array.prototype.slice.call(arguments);
				args.unshift(dom);
				return fn[index].apply(dom,args);
			};
		};

		for(ni in fn){
			apply_fns(self,ni);
		}

		self._back = context;

		if(!selector){
			return self;
		}

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
		if($dd.type(selector,'object') && selector.hasOwnProperty('_len')){
			return selector;
		}
		return DomObj(selector);
	};

	ret_func.atPoint = function(x,y){
		return $dd.dom(document.elementFromPoint(x,y));
	};

	$dd.mixin({
		dom : ret_func
	});

	return $dd.dom;
})($dd);
