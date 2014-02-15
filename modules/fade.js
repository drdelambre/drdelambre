// $dd.scrollFade
//		A module that watches your scrollable dom elements
//		and adds a pretty little fade to the bottom
// requires: $dd, $dd.model, $dd.dom

;(function(){
	function hexToRgb(hex){
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
	}
	$dd.mixin({
		scrollFade: function(data){
			var self = $dd.model({
				size: 60,
				color: '#ffffff',
				buffer: 30
			});
			self.pre(function(_data){
				if(_data.element)
					$dd.init(function(){
						self.element = $dd.dom(_data.element);
						if(self.element.css('position') == 'static')
							self.element.css({ 'position': 'relative' });
						self.element.on('scroll',function(){
							setTimeout(function(){
								self.draw();
							},1);
						});
						self.fader = $dd.dom('<div class="fade"></div>');
						self.element.append(self.fader);
						$dd.dom(window).on('resize',self.draw);
					});
				$dd.init(function(){setTimeout(function(){
					self.fader.css({
						background: 'url(' + makeFade() + ') repeat-x',
						position: 'absolute',
						left: 0,
						right: 0,
						height: (self.size + self.buffer) + 'px',
						zIndex: 30
					});
					self.draw();
				},1);});
			});

			function makeFade(){
				var canvas = document.createElement('canvas'),
					ctx = canvas.getContext('2d'),
					color = hexToRgb(self.color),
					g;

				canvas.width = 1;
				canvas.height = self.size + self.buffer;

				g = ctx.createLinearGradient(0,0,0,self.size);
				g.addColorStop(0,'rgba(' + color.r + ',' + color.g + ',' + color.b + ',0)');
				g.addColorStop(1,'rgba(' + color.r + ',' + color.g + ',' + color.b + ',1)');
				ctx.fillStyle = g;
				ctx.fillRect(0,0,1,self.size);
				ctx.fillStyle = self.color;
				ctx.fillRect(0,self.size,1,self.size+self.buffer);

				return canvas.toDataURL();
			}

			self.draw = function(){
				if(!self.element) return;

				var sH = self.element[0].scrollHeight - self.buffer,
					sT = self.element[0].scrollTop,
					cH = self.element[0].offsetHeight;

				if(sH <= cH + sT){
					self.fader.css({ display: 'none' });
					return;
				}
				self.fader.css({
					display: '',
					top: (cH + sT - self.size) + 'px'
				});
			};

			return self.serialize(data);
		}
	});
})();