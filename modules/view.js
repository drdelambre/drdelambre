// $dd.view_model
//		teh bones of any awesome web app. replaces the $dd.object paradigm
//		to reduce scope bugs and allow easier state migration through simple
//		objects.
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd','./basemodel','./dom'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('../dd'),require('./basemodel'), require('./dom'));
	} else {
		factory($dd, $dd.basemodel);
	}
})(function(lib, basemodel){
	if(lib.hasOwnProperty('view')){
		return;
	}
	var fns = {
		view_fill: function(self,def){
			def = def || {};
			self._view_fill = lib.extend(self._view_fill||{},def);

			return self;
		}
	};

	var ret = function(def){
		var self;

		def = lib.extend({ element: null }, def || {});

		if(def.hasOwnProperty('inherits')){
			self = def.inherits();
			delete def.inherits;

			self.extend(def);

			self.view_fill = function(def){ return fn.view_fill(self, def); };
		} else {
			self = basemodel()(def);
			self.view_fill = function(def){ return fn.view_fill(self, def); };
		}

		self.on_fill(function(_data){
			var template = _data.template || self.template;
			if(!_data.hasOwnProperty('element') && !self.element && template){
				lib.init(function(){
					self.element = lib.dom(lib.dom(template).html());
					if(self._view_fill.hasOwnProperty('element')){
						self._view_fill.element();
					}
				});
			} else if(_data.hasOwnProperty('element')){
				lib.init(function(){
					self.element = lib.dom(_data.element);
				});
			}

			if(!self._view_fill){
				return;
			}

			var ni, mapped;
			for(ni in self._view_fill){
				if(!self.def.hasOwnProperty(ni)){
					continue;
				}
				mapped = self.def[ni].external[0] || ni;
				if(!_data.hasOwnProperty(mapped)){
					continue;
				}

				lib.init(self._view_fill[ni]);
			}
		},1);

		return self;
	};

	lib.mixin({
		view: ret
	});

	return ret;
});
