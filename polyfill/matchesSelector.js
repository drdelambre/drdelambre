// polyfill for using matchesSelector in old doms
;(function(){
	window.Element.prototype.matchesSelector = window.Element.prototype.webkitMatchesSelector ||
		window.Element.prototype.mozMatchesSelector ||
		function(selector){
			var els = window.document.querySelectorAll(selector),
				ni,len;
			for(ni=0, len=els.length; ni<len; ni++ ){
				if(els[ni] === this){
					return true;
				}
			}

			return false;
		};
})();
