// $dd.touch
//		Browsers crapped on making themselves touch compatible
//		why should you suffer?
//		LETS MAKE IT BETTER
// requires: $dd, $dd.polyfill.keys, $dd.dom
define('modules/touch',['dd','modules/dom','polyfill/keys'],function($dd){
	$dd.mixin({
		istouch: !!('ontouchend' in document),
		touch : function(options){
			var self = {
				touches: {},
				throttle: null,
				options: $dd.extend({
					element: $dd.dom(window),
					start: null,
					move: null,
					end: null
				},options)
			};

			self.start = function(evt){
				evt.preventDefault();
				var count = Object.keys(self.touches).length,
					win = $dd.dom(window),
					ni, touch;
				if($dd.istouch){
					for(ni = 0; ni < evt.changedTouches.length; ni++){
						touch = evt.changedTouches[ni];
						if(self.touches[touch.identifier]) return;
						self.touches[touch.identifier] = touch;
						if(!$dd.type(self.options.start,'function')) continue;
						self.options.start({
							id: touch.identifier,
							target: $dd.dom(touch.target),
							pageX: touch.pageX,
							pageY: touch.pageY
						});
					}
				} else {
					self.touches[0] = evt;
					if($dd.type(self.options.start,'function'))
						self.options.start({
							id: 0,
							target: $dd.dom(evt.target),
							pageX: evt.pageX,
							pageY: evt.pageY
						});
				}


				if(count === 0 && $dd.istouch){
					win.on('touchmove', self.move);
					win.on('touchend', self.end);
					win.on('touchcancel', self.end);

					self.evts = {};
				} else if(!$dd.istouch){
					win.on('mousemove', self.move);
					win.on('mouseup', self.end);
				}

				return false;
			};
			self.move = function(evt){
				var ni, touch;
				evt.preventDefault();
				if(!$dd.istouch){
					self.evts = { 0:evt };
				} else {
					for(ni = 0; ni < evt.touches.length; ni++){
						touch = evt.touches[ni];
						if(!self.touches[touch.identifier]) continue;
						self.touches[touch.identifier] = touch;
						self.evts[touch.identifier] = touch;
					}
				}

				if(self.throttle)
					return;

				var t = function(){
					var no;
					for(no in self.touches){
						if(!self.evts[no]) continue;
						if($dd.type(self.options.move,'function'))
							self.options.move({
								id: no,
								target: $dd.dom(self.evts[no].target),
								pageX: self.evts[no].pageX,
								pageY: self.evts[no].pageY
							});
					}
					self.evts = {};
				};

				self.throttle = setInterval(t,50);
				t();
			};
			self.end = function(evt){
				var win = $dd.dom(window),
					touch, ni;
				if(!$dd.istouch){
					if($dd.type(self.options.end,'function'))
						self.options.end({
							id: 0,
							target: evt.target,
							pageX: evt.pageX,
							pageY: evt.pageY
						});
					delete self.touches[0];
				} else {
					for(ni = 0; ni < evt.changedTouches.length; ni++){
						touch = evt.changedTouches[ni];
						if(!self.touches[touch.identifier]) return;
						if($dd.type(self.options.end,'function'))
							self.options.end({
								id: touch.identifier,
								target: $dd.dom(touch.target),
								pageX: evt.pageX,
								pageY: evt.pageY
							});
						delete self.touches[touch.identifier];
					}
				}

				if(Object.keys(self.touches).length) return;

				if($dd.istouch){
					win.off('touchmove', self.move);
					win.off('touchend', self.end);
					win.off('touchcancel', self.end);
				} else {
					win.off('mousemove', self.move);
					win.off('mouseup', self.end);
				}

				self.touches = {};
				self.evts = {};
				if(self.throttle){
					clearInterval(self.throttle);
					self.throttle = null;
				}
			};
			self.remove = function(){
				var win = $dd.dom(window);
				if(!$dd.istouch){
					self.options.element.off('mousedown', self.start);
					win.off('mousemove', this.move);
					win.off('mouseup', this.end);
					return;
				}

				self.options.element.off('touchstart', self.start);

				win.off('touchmove', this.move);
				win.off('touchend', this.end);
				win.off('touchcancel', this.end);
			};

			self.options.element.on($dd.istouch?'touchstart':'mousedown', self.start);
			return self;
		}
	});

	return $dd.touch;
});
