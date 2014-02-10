// $dd.pubsub
//		loose coupling for all your custom modules
//		make sure to document your messages, as they're
//		easy to bury in the code
// requires: $dd
;(function(){
	var cache = {};
	$dd.mixin({
		pub : function(){
			var topic = arguments[0],
				args = Array.prototype.slice.call(arguments, 1)||[],
				ni, t;

			for(t in cache){
				if(!(new RegExp(t)).test(topic))
					continue;
				for(ni = 0; ni < cache[t].length; ni++)
					cache[t][ni].apply($dd, args);
			}
		},
		sub : function(topic, callback){
			topic = '^' + topic.replace(/\*/,'.*');
			if(!cache[topic])
				cache[topic] = [];
			cache[topic].push(callback);
			return [topic, callback];
		},
		unsub : function(handle){
			var t = handle[0], ni;
			if(!cache[t]) return;
			for(ni in cache[t]){
				if(cache[t][ni] == handle[1])
					cache[t].splice(ni, 1);
			}
		}
	});
})();
