/* {"requires": ["dd"]} */
// $dd.preload
//		just a little helper function that loads images
//		into memory
;(function(){
	var imgs = {};

	$dd.mixin({
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

					for(ni = 0; ni < c.length; ni++)
						c[ni]();

					delete imgs[href].onload;
				};
				img.src = href;
			}
			if(!$dd.type(onload,'function'))
				return;

			if(imgs[href].loaded)
				onload();
			else
				imgs[href].onload.push(onload);
		} 
	});
})();