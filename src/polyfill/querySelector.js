// polyfill for using querySelectorAll in old doms
;(function(){
	document.querySelectorAll = document.querySelectorAll||function(selector){
		var doc = document,
			head = doc.documentElement.firstChild,
			styleTag = doc.createElement('style');
		head.appendChild(styleTag);
		doc._qsa = [];

		styleTag.styleSheet.cssText = selector + "{x:expression(document._qsa.push(this))}";
		window.scrollBy(0, 0);

		return doc._qsa;
	};
})();