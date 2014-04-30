/* {"requires": ["modules/model"]} */
// $dd.model.knockout_interface
//		Allows you to use observables to create a reactive web application
//		using the $dd.model paradigm for your data structure
;(function($dd,knockout){
	$dd.model.watchInterface({
		observe: function(val){
			if($dd.type(val,'array')){
				return knockout.observableArray(val);
			}
			return knockout.observable(val);
		},
		unwrap: function(val){
			return knockout.utils.unwrapObservable(val);
		},
		read: function(vari){
			return vari();
		},
		write: function(vari,val){
			vari(val);
		}
	});
})($dd,ko);
