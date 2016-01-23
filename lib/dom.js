import { type } from './util.js';
import './shims/matchesSelector.js';

var events = {},
	dom_obj, ret_func;

const fn = {
	// This function needs to be beefed up like a mother
	// css(dom, obj) {
	// 	var val, primitives, ni, no;

	// 	if (type(obj, 'string')) {
	// 		val = window.document
	// 			.defaultView
	// 			.getComputedStyle(dom[0])[obj.replace(/-(\w)/g, cssCap)];

	// 		if (type(val, 'undefined') || val === 'none') {
	// 			return;
	// 		}

	// 		if (!isNaN(parseFloat(val))) {
	// 			return parseFloat(val);
	// 		}

	// 		if (/^matrix\(/i.test(val)) {
	// 			primitives = val.match(/(-?\d*\.?\d+)/g);
	// 			val = {};

	// 			if (primitives.length === 6) {
	// 				val.translateX = parseFloat(primitives[4]);
	// 				val.translateY = parseFloat(primitives[5]);
	// 				val.rotation = Math.atan(primitives[1] / primitives[3]);
	// 				val.scaleX = primitives[0] / Math.cos(val.rotation);
	// 				val.scaleY = primitives[3] / Math.cos(val.rotation);
	// 			}
	// 		}

	// 		return val;
	// 	}

	// 	for (ni = 0; ni < dom._len; ni++) {
	// 		for (no in obj) {
	// 			dom[ni].style[no.replace(/-(\w)/g, cssCap)] = obj[no];
	// 		}
	// 	}

	// 	return dom;
	// },
	addClass(dom, selector) {
		var sels = selector.split(','),
			len = dom._len,
			ni, no;

		dom.removeClass(selector);

		for (ni = 0; ni < len; ni++) {
			for (no = 0; no < sels.length; no++) {
				dom[ni].className += ' ' + sels[no].replace(/(^\s*|\s*$)/g, '');
			}
		}

		return dom;
	},
	removeClass(dom, selector) {
		var sels = selector.split(','),
			len = dom._len,
			ni, no, cname;

		for (ni = 0; ni < len; ni++) {
			cname = ' ' + dom[ni].className.replace(/\s+/g, ' ');
			for (no = 0; no < sels.length; no++) {
				cname = cname.replace(
					new RegExp(
						'\\s' + sels[no].replace(/(^\s*|\s*$)/g, ''),
						'g'),
					'');
			}
			dom[ni].className = cname.slice(1);
		}

		return dom;
	},
	matches(dom, selector) {
		var _selector = selector,
			ni, no;

		if (!type(selector, 'string')) {
			_selector = ret_func(selector);
		}

		for (ni = 0; ni < dom._len; ni++) {
			if (dom[ni] === window) {
				if ((type(_selector, 'string') && _selector === 'window') ||
					_selector[0] === window) {
					return true;
				}
			} else if (_selector.hasOwnProperty('_len')) {
				for (no = 0; no < _selector._len; no++) {
					if (dom[ni] !== _selector[no]) {
						continue;
					}

					return true;
				}
			/* istanbul ignore else */
			} else if (!!dom[ni].matchesSelector(_selector)) {
				return true;
			}
		}

		return false;
	},
	find(dom, selector) {
		return dom_obj(selector, dom);
	},
	__closest(dom, selector) {
		var elems = [],
			cap = window.document.documentElement,
			ni, no, len, curr, found;

		if (typeof selector !== 'string' && !selector.hasOwnProperty('_len')) {
			throw new Error('invalid selector passed to dom.closest');
		}

		for (ni = 0; ni < dom._len; ni++) {
			curr = dom[ni];

			while (curr !== cap) {
				if (typeof selector !== 'string') {
					found = false;
					for (no = 0; no < selector._len; no++) {
						if (selector[no] !== window && curr !== selector[no]) {
							continue;
						}

						found = true;
						break;
					}

					if (found) {
						break;
					}
				} else if (curr.matchesSelector(selector)) {
					break;
				}

				if (!curr.parentNode) {
					curr = cap;
					break;
				}
				curr = curr.parentNode;
			}

			if (curr === cap) {
				continue;
			}

			elems.push(curr);
		}

		len = elems.length;

		for (ni = 0; ni < len; ni++) {
			for (no = ni + 1; no < len; no++) {
				if (elems[ni] !== elems[no]) {
					continue;
				}

				elems.splice(no--, 1);
				len--;
			}
		}

		return elems;
	},
	closest(dom, selector) {
		var elems = fn.__closest(dom, selector),
			curr = dom_obj(null, dom),
			len, ni;

		if (!elems.length) {
			return curr;
		}

		len = curr._len = elems.length;

		for (ni = 0; ni < len; ni++) {
			curr[ni] = elems[ni];
		}

		return curr;
	},
	remove(dom) {
		var ni, len;

		for (ni = 0, len = dom._len; ni < len; ni++) {
			if (!dom[ni].parentNode) {
				continue;
			}

			dom[ni].parentNode.removeChild(dom[ni]);
		}

		return dom;
	},
	// This needs an overhaul as well
	// delay(dom, time) {
	// 	var _dom = dom,
	// 		funs = [],
	// 		ret = {},
	// 		ni;

	// 	function delay(ctx, name) {
	// 		var _ret = function() {
	// 			funs.push({
	// 				args: arguments,
	// 				ctx: ctx,
	// 				name: name
	// 			});

	// 			return ret;
	// 		};

	// 		return _ret;
	// 	}

	// 	function time_func() {
	// 		var ni;

	// 		for (ni = 0; ni < funs.length; ni++) {
	// 			if (typeof funs[ni].ctx[funs[ni].name] !== 'function') {
	// 				continue;
	// 			}

	// 			_dom = funs[ni].ctx[funs[ni].name].apply(dom, funs[ni].args);
	// 		}

	// 		if (--_dom._pending <= 0 && _dom._done.length) {
	// 			for (ni = 0; ni < _dom._done.length; ni++) {
	// 				_dom._done[ni](_dom);
	// 			}
	// 		}
	// 	}

	// 	for (ni in _dom) {
	// 		if (/^(_|init)/.test(ni)) {
	// 			continue;
	// 		}

	// 		ret[ni] = delay(_dom, ni);
	// 	}

	// 	_dom._pending++;

	// 	if (window._phantom) {
	// 		setTimeout(function() {
	// 			setTimeout(time_func, time);
	// 		}, 1);
	// 	} else {
	// 		setTimeout(time_func, time);
	// 	}

	// 	return ret;
	// },
	// done(dom, callback) {
	// 	if (!type(callback, 'function')) {
	// 		return dom;
	// 	}

	// 	if (dom._pending > 0) {
	// 		dom._done.push(callback);
	// 	} else {
	// 		callback(dom);
	// 	}

	// 	return dom;
	// },
	before(dom, elem) {
		var _elem, ni, no;

		if (!elem) {
			return dom;
		}

		_elem = ret_func(elem);

		for (ni = 0; ni < dom._len; ni++) {
			if (!dom[ni].parentNode) {
				continue;
			}

			for (no = 0; no < _elem._len; no++) {
				dom[ni].parentNode.insertBefore(_elem[no], dom[ni]);
			}
		}

		return dom;
	},
	after(dom, elem) {
		var _elem, ni, no;

		if (!elem) {
			return dom;
		}

		_elem = ret_func(elem);

		for (ni = 0; ni < dom._len; ni++) {
			if (!dom[ni].parentNode) {
				continue;
			}
			for (no = 0; no < _elem._len; no++) {
				dom[ni].parentNode.insertBefore(_elem[no], dom[ni].nextSibling);
			}
		}

		return dom;
	},
	next(dom, selector) {
		var curr;

		if (!dom[0]) {
			return dom_obj();
		}

		curr = dom[0].nextSibling;

		while (curr) {
			if (!type(curr, 'node') ||
				(selector && !dom_obj(curr).matches(selector))) {
				curr = curr.nextSibling;
				continue;
			}

			return dom_obj(curr);
		}

		return dom_obj();
	},
	nextAll(dom, selector) {
		var out = dom_obj(),
			curr = dom.next(selector);

		while (curr._len) {
			out[out._len] = curr[0];
			out._len++;
			curr = curr.next(selector);
		}

		return out;
	},
	prev(dom, selector) {
		var curr;

		if (!dom[0]) {
			return dom_obj();
		}

		curr = dom[0].previousSibling;

		while (curr) {
			if (!type(curr, 'node') ||
				(selector && !dom_obj(curr).matches(selector))) {
				curr = curr.previousSibling;
				continue;
			}

			return dom_obj(curr);
		}

		return dom_obj();
	},
	prevAll(dom, selector) {
		var out = dom_obj(),
			curr = dom.prev(selector);

		while (curr._len) {
			out[out._len] = curr[0];
			out._len++;
			curr = curr.prev(selector);
		}

		return out;
	},
	clone(dom) {
		var newDom = dom_obj(),
			ni, no, temp, attr;

		newDom._selector = dom._selector;
		newDom._len = dom._len;

		for (ni = 0; ni < dom._len; ni++) {
			temp = window.document.createElement(dom[ni].nodeName);
			attr = dom[ni].attributes;

			for (no = 0; no < attr.length; no++) {
				temp.setAttribute(attr[no].name, attr[no].value);
			}

			temp.innerHTML = dom[ni].innerHTML;
			newDom[ni] = temp;
		}

		return newDom;
	},
	measure(dom) {
		var box = dom[0].getBoundingClientRect(),
			body, clientTop, clientLeft, scrollTop, scrollLeft,
			top, left, styles,
			p_top, p_bottom, p_left, p_right,
			b_top, b_bottom, b_left, b_right;

		body = dom[0].ownerDocument.body;
		clientTop = (
			window.document.documentElement.clientTop ||
			body.clientTop ||
			0);
		clientLeft = (
			window.document.documentElement.clientLeft ||
			body.clientLeft ||
			0);
		scrollTop = (
			window.pageYOffset ||
			window.document.documentElement.scrollTop ||
			body.scrollTop);
		scrollLeft = (
			window.pageXOffset ||
			window.document.documentElement.scrollLeft ||
			body.scrollLeft);
		top = box.top + scrollTop - clientTop;
		left = box.left + scrollLeft - clientLeft;
		styles = window.document.defaultView.getComputedStyle(dom[0]);

		p_top = parseFloat(styles.getPropertyValue('padding-top'));
		p_bottom = parseFloat(styles.getPropertyValue('padding-bottom'));
		p_left = parseFloat(styles.getPropertyValue('padding-left'));
		p_right = parseFloat(styles.getPropertyValue('padding-right'));

		b_top = parseFloat(styles.getPropertyValue('border-top-width'));
		b_bottom = parseFloat(styles.getPropertyValue('border-bottom-width'));
		b_left = parseFloat(styles.getPropertyValue('border-left-width'));
		b_right = parseFloat(styles.getPropertyValue('border-right-width'));

		return {
			top: top,
			left: left,
			width: box.right - box.left,
			height: box.bottom - box.top,
			innerWidth: (
				box.right - box.left -
				(b_left + b_right + p_left + p_right)),
			innerHeight: (
				box.bottom - box.top -
				(b_top + b_bottom + p_top + p_bottom)),
			scrollWidth: dom[0].scrollWidth,
			scrollHeight: dom[0].scrollHeight,
			scrollLeft: dom[0].scrollLeft,
			scrollTop: dom[0].scrollTop
		};
	},
	get(dom, index) {
		if (index < 0 || index > dom._len) {
			return;
		}

		return ret_func(dom[index], dom);
	},
	html(dom, str) {
		var ni;

		if (type(str, 'undefined')) {
			return dom[0].innerHTML;
		}

		for (ni = 0; ni < dom._len; ni++) {
			dom[ni].innerHTML = str;
		}

		return dom;
	},
	append(dom, elem) {
		var _elem = ret_func(elem),
			ni, no;

		for (ni = 0; ni < dom._len; ni++) {
			for (no = 0; no < _elem._len; no++) {
				dom[ni].appendChild(_elem[no]);
			}
		}

		return dom;
	},
	prepend(dom, elem) {
		var _elem = ret_func(elem),
			ni, no, a;

		for (ni = 0; ni < dom._len; ni++) {
			a = dom[ni].firstChild;
			for (no = 0; no < _elem._len; no++) {
				dom[ni].insertBefore(_elem[no], a);
			}
		}

		return dom;
	},
	on(dom, evt, fun) {
		var _evt, _list, ni;

		if (/^(focus|blur)$/.test(evt)) {
			/* istanbul ignore next: Unsupported by PhantomJS */
			_evt = window.addEvent ? 'on' + evt : evt;
			/* istanbul ignore next: Unsupported by PhantomJS */
			_list = window.addEvent ? 'addEvent' : 'addEventListener';

			for (ni = 0; ni < dom._len; ni++) {
				dom[ni][_list](_evt, fun);
			}

			return dom;
		}

		if (!events[evt]) {
			events[evt] = (function() {
				var s = {
					evt: evt,
					fun: null,
					routes: []
				};

				s.fun = function(_e) {
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
					var t = ret_func(_e.target),
						ni, na;

					for (ni = 0; ni < s.routes.length; ni++) {
						na = t.closest(s.routes[ni].dom);

						if (!na.hasOwnProperty('_len') || !na._len) {
							continue;
						}

						s.routes[ni].callback(_e);
					}
				};

				return s;
			})();

			/* istanbul ignore if: Unsupported by PhantomJS */
			if (window.addEvent) {
				if (evt === 'scroll') {
					window.addEventListener(
						'onmousewheel',
						events[evt].fun,
						false
					);
				} else {
					window.addEvent('on' + evt, events[evt].fun);
				}
			} else if (window.addEventListener) {
				if (evt === 'scroll') {
					window.addEventListener('wheel', events[evt].fun, false);
				} else {
					window.addEventListener(evt, events[evt].fun, false);
				}
			}
		}

		events[evt].routes.push({ dom: dom, callback: fun });
		return dom;
	},
	off(dom, evt, fun) {
		var r, ni;

		if (!events[evt] || !events[evt].routes.length) {
			return;
		}

		r = events[evt].routes;

		for (ni = r.length; ni > 0;) {
			if (!dom.matches(r[--ni].dom)) {
				continue;
			}

			if (fun && r[ni].callback !== fun) {
				continue;
			}

			r.splice(ni, 1);
		}

		return dom;
	},
	fire(dom, evt) {
		var ni;

		function real_fire(obj, _evt) {
			var evObj;

			// need to add the new MouseEvent syntax
			/* istanbul ignore else: Unsupported by PhantomJS */
			if (window.document.createEvent) {
				evObj = window.document.createEvent('MouseEvent');
				evObj.initMouseEvent(
					_evt,
					true,
					true,
					window,
					0,
					0,
					0,
					0,
					0,
					false,
					false,
					false,
					false,
					0,
					null
				);
				obj.dispatchEvent(evObj);
			} else if (window.document.createEventObject) {
				evObj = window.document.createEventObject();
				obj.fireEvent('on' + _evt, evObj);
			}
		}

		for (ni = 0; ni < dom._len; ni++) {
			real_fire(dom[ni], evt);
		}

		return dom;
	},
	focus(dom) {
		var ni;

		for (ni = 0; ni < dom._len; ni++) {
			/* istanbul ignore else */
			if (/(input|textarea)/i.test(dom[ni].nodeName)) {
				dom[ni].focus();
				return dom;
			}
		}
	},
	blur(dom) {
		var ni;

		for (ni = 0; ni < dom._len; ni++) {
			/* istanbul ignore else */
			if (/(input|textarea)/i.test(dom[ni].nodeName)) {
				dom[ni].blur();
				return dom;
			}
		}
	},
	each(dom, callback) {
		var ni;

		for (ni = 0; ni < dom._len; ni++) {
			callback(dom.get(ni), ni);
		}

		return dom;
	}
};

function cleanSelector(selector, _context) {
	var sels = (selector || '').split(','),
		context = _context || window.document,
		res = [],
		ni, idpos, ctx;

	if (!selector.length) {
		return [];
	}

	for (ni = 0; ni < sels.length; ni++) {
		idpos = sels[ni].lastIndexOf('#');
		ctx = context;

		if (idpos > 0) {
			ctx = document.getElementById(
				sels[ni].substr(idpos).match(/^#[^\s]*/)[0].slice(1));

			sels[ni] = sels[ni]
				.substr(idpos)
				.replace(/^#[^\s]*[\s]*/, '');
		}

		if (!ctx || !sels[ni].length) {
			continue;
		}

		res = res.concat(
			Array.prototype.slice.call(ctx.querySelectorAll(sels[ni]), 0));
	}

	return res;
}

// function cssCap(a, x) {
// 	return x.toUpperCase();
// }

dom_obj = function dom_obj(selector, context) {
	var dom = {
			_back: null,
			_len: 0,
			_selector: '',
			_pending: 0,
			_done: []
		},
		res = [],
		elem, ni, c;

	// dom.css = function(obj) { return fn.css(dom, obj); };
	dom.addClass = function(_selector) { return fn.addClass(dom, _selector); };
	dom.removeClass = function(_selector) {
		return fn.removeClass(dom, _selector);
	};
	dom.matches = function(_selector) { return fn.matches(dom, _selector); };
	dom.find = function(_selector) { return fn.find(dom, _selector); };
	dom.closest = function(_selector) { return fn.closest(dom, _selector); };
	dom.remove = function() { return fn.remove(dom); };
	// dom.delay = function(time) { return fn.delay(dom, time); };
	// dom.done = function(cb) { return fn.done(dom, cb); };
	dom.before = function(elem) { return fn.before(dom, elem); };
	dom.after = function(elem) { return fn.after(dom, elem); };
	dom.append = function(elem) { return fn.append(dom, elem); };
	dom.prepend = function(elem) { return fn.prepend(dom, elem); };
	dom.next = function(_selector) { return fn.next(dom, _selector); };
	dom.nextAll = function(_selector) { return fn.nextAll(dom, _selector); };
	dom.prev = function(_selector) { return fn.prev(dom, _selector); };
	dom.prevAll = function(_selector) { return fn.prevAll(dom, _selector); };
	dom.clone = function() { return fn.clone(dom); };
	dom.measure = function() { return fn.measure(dom); };
	dom.get = function(index) { return fn.get(dom, index); };
	dom.length = function() { return dom._len; };
	dom.html = function(string) { return fn.html(dom, string); };
	dom.on = function(evt, cb) { return fn.on(dom, evt, cb); };
	dom.off = function(evt, cb) { return fn.off(dom, evt, cb); };
	dom.fire = function(evt) { return fn.fire(dom, evt); };
	dom.focus = function() { return fn.focus(dom); };
	dom.blur = function() { return fn.blur(dom); };
	dom.each = function(cb) { return fn.each(dom, cb); };

	dom._back = context;

	if (!selector) {
		return dom;
	}

	if (type(selector, 'node')) {
		dom[0] = selector;
		dom._len = 1;
		return dom;
	}

	if (/^[^<]*(<[\w\W]+>)[^>]*$/.test(selector)) {
		elem = window.document.createElement('tbody');
		elem.innerHTML = selector.replace(/(^\s*|\s*$)/g, '');
		c = Array.prototype.slice.call(elem.childNodes, 0);
		dom._len = c.length;

		for (ni = 0; ni < dom._len; ni++) {
			c[ni].parentNode.removeChild(c[ni]);
			dom[ni] = c[ni];
		}

		return dom;
	}

	//need to add ability to create element or take normal element
	dom._selector = selector;

	if (context && context._len) {
		for (ni = 0; ni < context._len; ni++) {
			res = res.concat(cleanSelector(selector, context[ni]));
		}
	} else {
		res = cleanSelector(selector);
	}

	for (ni = 0; ni < res.length; ni++) {
		dom[ni] = res[ni];
	}

	dom._len = res.length;

	return dom;
};

ret_func = function ret_func(selector) {
	if (type(selector, 'object') && selector.hasOwnProperty('_len')) {
		return selector;
	}

	return dom_obj(selector);
};

ret_func.atPoint = function(x, y) {
	return ret_func(window.document.elementFromPoint(x, y));
};

export default ret_func;
