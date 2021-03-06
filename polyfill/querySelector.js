// polyfill for using querySelectorAll in old doms
;(function(){
	window.document.querySelectorAll = window.document.querySelectorAll||function(selector){
		var doc = window.document,
			head = doc.documentElement.firstChild,
			styleTag = doc.createElement('style');
		head.appendChild(styleTag);
		doc._qsa = [];

		styleTag.styleSheet.cssText = selector + "{x:expression(document._qsa.push(this))}";
		window.scrollBy(0, 0);

		return doc._qsa;
	};
})();