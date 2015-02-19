/* {"requires": ["dd"]} */
// $dd.route
//		LETS DO SOME SINGLE PAGE APPS! This module sets up a hashchange
//		listener and calls functions based on routes. There are some issues
//		with route depth (order of execution when matching more than one route)
//		so watch your order of definition. The basic format is:
//
//		$dd.route(path,on_open,on_close)
//
//		where on_open and on_close manage your page lifecycle and path defines
//		the format that matches the hash and passes variables to your open
//		function in this manner: 
//
// 		/beans/:id/:username?/cool has an optional username param and always
//			passes an id to the open function. beans and cool are static
//			strings in the hash
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('../dd'));
	} else {
		factory($dd);
	}
})(function(lib){
	if(lib.hasOwnProperty('route')){
		return;
	}

	var paths = {},
		current = null;

	function handleChange(){
		var hash = window.location.hash.replace(/^#!?\//,''),
			ni,no,args;

		if(current && paths[current] && !paths[current].regexp.test(hash)){
			for(no = 0; no < paths[current].after.length; no++){
				if(typeof paths[current].after[no] === 'function'){
					paths[current].after[no]();
				}
			}
		}

		for(ni in paths){
			if(!paths[ni].regexp.test(hash) || hash === current){
				continue;
			}

			args = paths[ni].regexp.exec(hash).splice(1);

			for(no = 0; no < paths[ni].before.length; no++){
				paths[ni].before[no].apply(null,args);
			}
			current = ni;
		}
	}

	if(window.attachEvent){
		window.attachEvent('onhashchange',handleChange);
	} else {
		window.addEventListener('hashchange',handleChange,false);
	}

	lib.init(function(){ handleChange(); });

	var ret  = function(path,open,close){
		var keys = [];

		if(lib.type(path,'array')){
			path = '(' + path.join('|') + ')';
		}

		path = path
			.replace(/\/\(/g, '(?:/')
			.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){ // jshint ignore:line
				keys.push({ name: key, optional: !! optional });
				slash = slash || '';
				return '' +
					(optional ? '' : slash) +
					'(?:' +
					(optional ? slash : '') +
					(format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' +
					(optional || '');
				})
			.replace(/([\/.])/g, '\\$1')
			.replace(/\*/g, '(.*)');
		path = '^' + path + '$';

		if(!paths[path]){
			paths[path] = {
				regexp: new RegExp(path),
				keys: keys,
				before: [],
				after: []
			};
		}
		if(typeof open === 'function'){
			paths[path].before.push(open);
		}
		if(typeof close === 'function'){
			paths[path].after.push(close);
		}
	};

	ret.goto = function(hash){
		window.location.hash = '#/' + hash;
	};

	lib.mixin({
		route: ret
	});
});
