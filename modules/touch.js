/* {"requires": ["dd","polyfill/keys","modules/dom"]} */
// $dd.touch
//		Browsers crapped on making themselves touch compatible
//		why should you suffer?
//		LETS MAKE IT BETTER
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd','../polyfill/keys','./dom'], factory);
	} else {
		factory($dd);
	}
})(function(lib){
	lib.mixin({
		istouch: !!('ontouchend' in document),
		touch : function(options){
			var touches = {},
				evts = {},
				throttle = null,
				win = lib.dom(window),
				self = lib.extend({
					element: window,
					start: null,
					move: null,
					end: null,
					click: null
				},options);
			if(!options.hasOwnProperty('exclude')){
				options.exclude = [];
			}
			if(!lib.type(options.exclude,'array')){
				options.exclude = [ options.exclude ];
			}
			self.exclude = options.exclude;

			function makeEvt(evt){
				return {
					id: lib.istouch?evt.identifier:0,
					target: lib.dom(evt.target),
					pageX: evt.pageX,
					pageY: evt.pageY
				};
			}

			function start(evt){
				var ignoreAll, ignore,
					tar, ni, no, touch;

				if(lib.istouch){
					ignoreAll = true;
					for(ni = 0; ni < evt.changedTouches.length; ni++){
						ignore = false;
						touch = evt.changedTouches[ni];
						touch.has_moved = false;

						tar = lib.dom(touch.target);
						for(no = 0; no < self.exclude.length; no++){
							if(tar.closest(self.exclude[no])._len){
								ignore = true;
								break;
							}
						}

						if(ignore){
							continue;
						}

						//this should never happen
						if(touches[touch.identifier]){
							return;
						}

						ignoreAll = false;

						touches[touch.identifier] = touch;
						if(!lib.type(self.start,'function')){
							continue;
						}
						self.start(makeEvt(touch));
					}

					if(!ignoreAll){
						evt.preventDefault();
					}
				} else {
					ignore = false;
					tar = lib.dom(evt.target);
					for(ni = 0; ni < self.exclude.length; ni++){
						if(tar.closest(self.exclude[ni])._len){
							ignore = true;
							break;
						}
					}
					if(ignore){
						return;
					}

					evt.preventDefault();
					touches[0] = evt;
					evt.has_moved = false;

					if(lib.type(self.start,'function')){
						self.start(makeEvt(evt));
					}
				}


				if(Object.keys(touches).length === 1 && lib.istouch){
					win.on('touchmove', move);
					win.on('touchend', end);
					win.on('touchcancel', end);

					evts = {};
				} else if(!lib.istouch){
					win.on('mousemove', move);
					win.on('mouseup', end);
				}

				return false;
			}
			function move(evt){
				var ni, touch;
				evt.preventDefault();
				if(!lib.istouch){
					evts = { 0:evt };
				} else {
					for(ni = 0; ni < evt.touches.length; ni++){
						touch = evt.touches[ni];
						if(!touches[touch.identifier]){
							continue;
						}
						touches[touch.identifier] = touch;
						evts[touch.identifier] = touch;
					}
				}

				if(throttle){
					return;
				}

				var t = function(){
					var no;
					for(no in touches){
						if(!evts[no]){
							continue;
						}
						touches[no].has_moved = true;
						if(lib.type(self.move,'function')){
							self.move(makeEvt(evts[no]));
						}
					}
					evts = {};
				};

				throttle = setInterval(t,50);
				t();
			};
			function end(evt){
				var win = lib.dom(window),
					touch, ni;
				if(!lib.istouch){
					if(lib.type(self.click,'function') && !touches[0].has_moved){
						self.click(makeEvt(evt));
					}
					if(lib.type(self.end,'function')){
						self.end(makeEvt(evt));
					}
					delete touches[0];
				} else {
					for(ni = 0; ni < evt.changedTouches.length; ni++){
						touch = evt.changedTouches[ni];
						if(!touches[touch.identifier]){
							return;
						}
						if(lib.type(self.end,'function')){
							self.end(makeEvt(touch));
						}
						delete touches[touch.identifier];
					}
				}

				if(Object.keys(touches).length){
					return;
				}

				if(lib.istouch){
					win.off('touchmove', move);
					win.off('touchend', end);
					win.off('touchcancel', end);
				} else {
					win.off('mousemove', move);
					win.off('mouseup', end);
				}

				touches = {};
				evts = {};
				if(throttle){
					clearInterval(throttle);
					throttle = null;
				}
			};

			self.remove = function(){
				if(!lib.istouch){
					self.element.off('mousedown', start);
					win.off('mousemove', move);
					win.off('mouseup', end);
					return;
				}

				self.element.off('touchstart', start);

				win.off('touchmove', move);
				win.off('touchend', end);
				win.off('touchcancel', end);
			};

			lib.init(function(){
				lib.dom(self.element).on(lib.istouch?'touchstart':'mousedown', start);
			});

			return self;
		}
	});
});
