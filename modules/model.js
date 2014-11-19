// $dd.model
//		teh bones of any awesome web app. replaces the $dd.object paradigm
//		to reduce scope bugs and allow easier state migration through simple
//		objects.
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd','./basemodel'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('../dd'),require('./basemodel'));
	} else {
		factory($dd);
	}
})(function(lib, basemodel){
	var ret = basemodel();

	lib.mixin({
		model: ret
	});

	return ret;
});
