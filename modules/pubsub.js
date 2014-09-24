// $dd.pubsub
//		loose coupling for all your custom modules
//		make sure to document your messages, as they're
//		easy to bury in the code
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('../dd'));
	} else {
		factory($dd);
	}
})(function(lib){
	var cache = {};

	function generate_topic(topic){
		var ret = {
			topic: topic,
			path: '',
			regexp: null,
			keys: [],
			subs: []
		};

		ret.path = '^' + topic
			.replace(/\/\(/g, '(?:/')
			.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){ // jshint ignore:line
				ret.keys.push({ name: key, optional: !! optional });
				slash = slash || '';
				return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
			})
			.replace(/([\/.])/g, '\\$1')
			.replace(/\*/g, '(.*)') + '$';

		ret.regexp = new RegExp(ret.path);

		return ret;
	}

	function clean_path_args(path,descriptor,args){
		var path_args = descriptor.regexp.exec(path).slice(1) || [],
			ni,no;

		for(ni = 0; ni < path_args.length; ni++){
			no = parseFloat(path_args[ni]);
			if(!isNaN(no)){
				path_args[ni] = no;
			}
		}

		return path_args.concat(args||[]);
	}

	lib.mixin({
		pub : function(){
			var topic = arguments[0],
				args = Array.prototype.slice.call(arguments, 1)||[],
				found = false,
				ni, t, path_args;

			for(t in cache){
				if(!(new RegExp(t)).test(topic)){
					continue;
				}
				found = true;
				path_args = clean_path_args(topic,cache[t],args);

				for(ni = 0; ni < cache[t].subs.length; ni++){
					cache[t].subs[ni].apply(lib, path_args);
				}
			}
		},
		sub : function(topic, callback){
			topic = generate_topic(topic);
			if(!cache.hasOwnProperty(topic.path)){
				cache[topic.path] = topic;
			}
			cache[topic.path].subs.push(callback);
			return [topic.path, callback];
		},
		unsub : function(topic, callback){
			topic = generate_topic(topic);
			for(var ni = 0; ni < cache[topic.path].subs.length; ni++){
				if(cache[topic.path].subs[ni] === callback){
					cache[topic.path].subs.splice(ni, 1);
				}
			}
		},
		channels : function(){
			var out = [],
				ni;

			for(ni in cache){
				out.push(cache[ni].topic);
			}
			console.log('Subscribed Channels:\n\t' + out.sort().join('\n\t'));
		}
	});
});
