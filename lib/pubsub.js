import setImmediate from './shims/setImmediate.js';
import { generate_topic } from './util.js';

var cache = {};

function clean_path_args(path, descriptor, args) {
	var path_args = descriptor.regexp.exec(path).slice(1),
		ni, no;

	for (ni = 0; ni < path_args.length; ni++) {
		no = parseFloat(path_args[ni]);

		if (!isNaN(no)) {
			path_args[ni] = no;
		}
	}

	return path_args.concat(args);
}

function create_async_pub(fun, params) {
	setImmediate(function() {
		fun.apply(fun, params);
	});
}

export function pub(topic, ...args) {
	var ni, t, path_args;

	for (t in cache) {
		if (!cache[t].regexp.test(topic)) {
			continue;
		}
		path_args = clean_path_args(topic, cache[t], args);

		for (ni = 0; ni < cache[t].subs.length; ni++) {
			create_async_pub(cache[t].subs[ni], path_args);
		}
	}
}

export function sub(topic, callback) {
	const _topic = generate_topic(topic);

	if (typeof callback !== 'function') {
		return;
	}

	if (!cache.hasOwnProperty(_topic.path)) {
		cache[_topic.path] = _topic;
	}

	cache[_topic.path].subs.push(callback);
	return [ _topic.path, callback ];
}

export function unsub(topic, callback) {
	const _topic = generate_topic(topic);
	var ni;

	if (!cache.hasOwnProperty(_topic.path)) {
		return;
	}

	for (ni = 0; ni < cache[_topic.path].subs.length; ni++) {
		if (cache[_topic.path].subs[ni] === callback) {
			cache[_topic.path].subs.splice(ni, 1);
		}
	}
}

export function clear() {
	cache = {};
}

export function channels() {
	var out = [],
		ni;

	for (ni in cache) {
		out.push(cache[ni].topic);
	}

	/*eslint-disable */
	console.log('Subscribed Channels:\n\t' + out.sort().join('\n\t'));
	/*eslint-enable */
}
