/**\

A setImmediate polyfill by these guys: https://github.com/YuzuJS/setImmediate

Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

\**/

export default (function(global, undef) {
	var nextHandle = 1, // Spec says greater than zero
		tasksByHandle = {},
		currentlyRunningATask = false,
		doc = global.document,
		setImmediate, attachTo;

	if (global.setImmediate) {
		return global.setImmediate;
	}

	function partiallyApplied(handler) {
		var args = [].slice.call(arguments, 1);

		return function() {
			if (typeof handler === 'function') {
				handler.apply(undef, args);
			} else {
				(new Function('' + handler))(); // eslint-disable-line
			}
		};
	}

	function addFromSetImmediateArguments(args) {
		tasksByHandle[nextHandle] = partiallyApplied.apply(undef, args);
		return nextHandle++;
	}

	function runIfPresent(handle) {
		var task;

		if (currentlyRunningATask) {
			setTimeout(partiallyApplied(runIfPresent, handle), 0);
		} else {
			task = tasksByHandle[handle];

			if (task) {
				currentlyRunningATask = true;
				try {
					task();
				} finally {
					clearImmediate(handle);
					currentlyRunningATask = false;
				}
			}
		}
	}

	function clearImmediate(handle) {
		delete tasksByHandle[handle];
	}

	function installNextTickImplementation() {
		setImmediate = function() {
			var handle = addFromSetImmediateArguments(arguments);

			process.nextTick(partiallyApplied(runIfPresent, handle));
			return handle;
		};
	}

	function canUsePostMessage() {
		var postMessageIsAsynchronous, oldOnMessage;

		if (global.postMessage && !global.importScripts) {
			postMessageIsAsynchronous = true;
			oldOnMessage = global.onmessage;

			global.onmessage = function() {
				postMessageIsAsynchronous = false;
			};

			global.postMessage('', '*');
			global.onmessage = oldOnMessage;

			return postMessageIsAsynchronous;
		}
	}

	function installPostMessageImplementation() {
		var messagePrefix = 'setImmediate$' + Math.random() + '$',
			onGlobalMessage = function(event) {
				if (event.source === global &&
					typeof event.data === 'string' &&
					event.data.indexOf(messagePrefix) === 0) {
					runIfPresent(+event.data.slice(messagePrefix.length));
				}
			};

		if (global.addEventListener) {
			global.addEventListener('message', onGlobalMessage, false);
		} else {
			global.attachEvent('onmessage', onGlobalMessage);
		}

		setImmediate = function() {
			var handle = addFromSetImmediateArguments(arguments);

			global.postMessage(messagePrefix + handle, '*');

			return handle;
		};
	}

	function installMessageChannelImplementation() {
		var channel = new MessageChannel();

		channel.port1.onmessage = function(event) {
			var handle = event.data;

			runIfPresent(handle);
		};

		setImmediate = function() {
			var handle = addFromSetImmediateArguments(arguments);

			channel.port2.postMessage(handle);
			return handle;
		};
	}

	function installReadyStateChangeImplementation() {
		var html = doc.documentElement;

		setImmediate = function() {
			var handle = addFromSetImmediateArguments(arguments),
				script = doc.createElement('script');

			script.onreadystatechange = function() {
				runIfPresent(handle);
				script.onreadystatechange = null;
				html.removeChild(script);
				script = null;
			};

			html.appendChild(script);

			return handle;
		};
	}

	function installSetTimeoutImplementation() {
		setImmediate = function() {
			var handle = addFromSetImmediateArguments(arguments);

			setTimeout(partiallyApplied(runIfPresent, handle), 0);
			return handle;
		};
	}

	attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
	attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

	if ({}.toString.call(global.process) === '[object process]') {
		installNextTickImplementation();
	} else if (canUsePostMessage()) {
		installPostMessageImplementation();
	} else if (global.MessageChannel) {
		installMessageChannelImplementation();
	} else if (doc && 'onreadystatechange' in doc.createElement('script')) {
		installReadyStateChangeImplementation();
	} else {
		installSetTimeoutImplementation();
	}

	attachTo.setImmediate = setImmediate;
	attachTo.clearImmediate = clearImmediate;

	return setImmediate;
})(new Function('return this')()); // eslint-disable-line
