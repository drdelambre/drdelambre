// $dd.preload
//		just a little helper function that loads images
//		into memory
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd'], factory);
	} else {
		factory($dd);
	}
})(function(lib){
	var imgs = {};

	lib.mixin({
		preload: function(href, onload){
			if(!imgs.hasOwnProperty(href)){
				imgs[href] = {
					loaded: false,
					onload: []
				};
				var img = new Image();
				img.onLoad = function(){
					imgs[href].loaded = true;

					var c = imgs[href].onload,
						ni;

					for(ni = 0; ni < c.length; ni++){
						c[ni]();
					}

					delete imgs[href].onload;
				};
				img.src = href;
			}
			if(!lib.type(onload,'function')){
				return;
			}

			if(imgs[href].loaded){
				onload();
			} else {
				imgs[href].onload.push(onload);
			}
		} 
	});
});