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
		factory($dd, basemodel);
	}
})(function(lib, basemodel){
	basemodel.fns = lib.extend(basemodel.fns, {
		view_fill: function(self,def){
			def = def || {};
			self._view_fill = lib.extend(self._view_fill||{},def);

			return self;
		},
		from_model: function(self,model){
			self.extend(model.def || {});
			self.fill(model.out());

			return self;
		}
	});

	var base = basemodel();

	var ret = function(def){
		var self = base(def).on_fill(function(_data){
			var template = _data.template || self.template;
			if(!_data.hasOwnProperty('element') && !self.hasOwnProperty('element') && template){
				_data.element = true;
				lib.init(function(){
					_data.element = lib.dom(self.template).html();
					console.log('setting template', _data.element);
				});
			}

			if(_data.hasOwnProperty('element')){
				lib.init(function(){
					self.element = lib.dom(_data.element);
					console.log('with element', self.element);
				});
			}
		}).on_fill(function(_data){
			if(!self._view_fill){
				return;
			}
			for(var ni in self._view_fill){
				if(!_data.hasOwnProperty(ni)){
					continue;
				}

				lib.init(self._view_fill[ni]);
			}
		},1);

		return self;
	};

	lib.mixin({
		view_model: ret
	});

	return ret;
});
