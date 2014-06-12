// $dd.pubsub
//		loose coupling for all your custom modules
//		make sure to document your messages, as they're
//		easy to bury in the code
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd'], factory);
	} else {
		factory($dd);
	}
})(function(lib){
	var reg = {},
		cache = {};

	function generate_topic(topic){
		return '^' + topic.replace(/\*/,'.*') + '$';
	}

	lib.mixin({
		channel: function(topic,description){
			if(reg.hasOwnProperty(topic)){
				return;
			}
			reg[topic] = description;
			cache[generate_topic(topic)] = [];
		},
		pub : function(){
			var topic = arguments[0],
				args = Array.prototype.slice.call(arguments, 1)||[],
				found = false,
				ni, t;

			for(t in cache){
				if(!(new RegExp(t)).test(topic)){
					continue;
				}
				found = true;
				for(ni = 0; ni < cache[t].length; ni++){
					cache[t][ni].apply(lib, args);
				}
			}
			if(!found){
				console.log('$dd.pub: Unregistered channel ' + topic);
			}
		},
		sub : function(topic, callback){
			topic = generate_topic(topic);
			if(!cache.hasOwnProperty(topic)){
				console.log('$dd.sub: Unregistered channel ' + topic);
				return;
			}
			cache[topic].push(callback);
			return [topic, callback];
		},
		unsub : function(handle){
			var t = handle[0], ni;
			for(ni in cache[t]){
				if(cache[t][ni] === handle[1]){
					cache[t].splice(ni, 1);
				}
			}
		},
		channels : function(){
			var out = '\n',
				ni;

			for(ni in reg){
				out += '\nChannel:     ' + ni +
					   '\nDescription: ' + reg[ni] + '\n';
			}
			console.log(out);
		}
	});
});