// polyfill for using matchesSelector in old doms
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define([], factory);
	} else {
		factory();
	}
})(function(){
	Element.prototype.matchesSelector = Element.prototype.webkitMatchesSelector ||
		Element.prototype.mozMatchesSelector ||
		function(selector){
			var els = document.querySelectorAll(selector),
				ni,len;
			for(ni=0, len=els.length; ni<len; ni++ ){
				if(els[ni] === this){
					return true;
				}
			}

			return false;
		};
});
