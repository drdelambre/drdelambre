/* {"requires": ["modules/model"]} */
// $dd.model.knockout_interface
//		Allows you to use observables to create a reactive web application
//		using the $dd.model paradigm for your data structure
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd','knockout','./model'], factory);
	} else {
		factory($dd,ko);
	}
})(function(lib,ko){
	lib.model.watchInterface({
		observe: function(val){
			if(lib.type(val,'array')){
				return ko.observableArray(val);
			}
			return ko.observable(val);
		},
		unwrap: function(val){
			return ko.utils.unwrapObservable(val);
		},
		read: function(vari){
			return vari();
		},
		write: function(vari,val){
			vari(val);
		}
	});
});
