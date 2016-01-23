import dom from 'base/dom';

describe('DOM manipulation library navigation functions', function() {
	var test_ground,
		test_dom = (
			'<div id="beans">\
				<div class="beans">\
					<span></span>\
					<span></span>\
					<span></span>\
				</div>\
				<div class="bread hashtag">\
					<span></span>\
					<span></span>\
					<span></span>\
				</div>\
				<div class="bread yolo">\
					<span></span>\
					<span></span>\
					<span>\
						<div class="bread">\
							<label>IM SOME TEXT</label>\
						</div>\
					</span>\
				</div>\
			</div>');

	before(function() {
		test_ground = document.createElement('DIV');

		document.body.appendChild(test_ground);
	});

	beforeEach(function() {
		test_ground.innerHTML = test_dom;
	});

	after(function() {
		test_ground.parentNode.removeChild(test_ground);
		test_ground = null;
	});

	it('should select by id', function() {
		var node = dom('#beans');

		expect(node.length()).to.equal(1);
		expect(node[0]).to.equal(document.getElementById('beans'));
	});

	it('should select by class', function() {
		var node = dom('.beans');

		expect(node.length()).to.equal(1);
		expect(node[0]).to
			.equal(test_ground.getElementsByClassName('beans')[0]);
	});

	it('should select by point', function() {
		var node = dom(test_ground).find('label'),
			offsets = (function(elem) {
				var element = elem,
					top = 0,
					left = 0;

				do {
					top += element.offsetTop || 0;
					left += element.offsetLeft || 0;
					element = element.offsetParent;
				} while (element);

				return {
					top: top,
					left: left
				};
			})(node[0]);

		expect(dom.atPoint(offsets.left + 2, offsets.top + 2)[0])
			.to.equal(node[0]);
	});

	it('should select hierarchies', function() {
		var nodes = dom('window #beans .beans span'),
			decoy = dom('window #yolo span');

		expect(nodes.length()).to.equal(3);
		expect(decoy.length()).to.equal(0);
		expect(nodes[0]).to.equal(test_ground.getElementsByTagName('span')[0]);
		expect(nodes[1]).to.equal(test_ground.getElementsByTagName('span')[1]);
		expect(nodes[2]).to.equal(test_ground.getElementsByTagName('span')[2]);
	});

	it('should wrap nodes', function() {
		var node = dom(test_ground);

		expect(dom(test_ground)[0]).to.equal(test_ground);
		expect(dom(window)[0]).to.equal(window);
		expect(dom(document.body)[0]).to.equal(document.body);
		expect(dom(node)).to.equal(node);

		expect(dom().length()).to.equal(0);
	});

	it('should generate nodes', function() {
		var node1 = dom('<div class="beans"><span></span></div>'),
			node2 = dom('<tr><td colspan=2></td></tr>');

		expect(node1[0].nodeName.toLowerCase()).to.equal('div');
		expect(node1[0].className).to.equal('beans');
		expect(node1.find('span').length()).to.equal(1);

		expect(node2[0].nodeName.toLowerCase()).to.equal('tr');
		expect(node2.find('td').length()).to.equal(1);
		expect(node2.find('td')[0].getAttribute('colspan')).to.equal('2');
	});

	it('should select compounded class names', function() {
		var node = dom(test_ground).find('.bread.yolo');

		expect(node.length()).to.equal(1);
		expect(node[0]).to
			.equal(test_ground.getElementsByClassName('bread')[1]);
	});

	it('should search within context', function() {
		var nodes = dom('.beans').find('span');

		expect(nodes.length()).to.equal(3);
		expect(nodes[0]).to
			.equal(test_ground.getElementsByTagName('span')[0]);
		expect(nodes[1]).to
			.equal(test_ground.getElementsByTagName('span')[1]);
		expect(nodes[2]).to
			.equal(test_ground.getElementsByTagName('span')[2]);
	});

	it('should join multiple contexts on search', function() {
		var nodes = dom('.bread').find('span');

		expect(nodes.length()).to.equal(6);
	});

	it('should select in a list', function() {
		var nodes = dom('.beans').find('span');

		expect(nodes.length()).to.equal(3);
		expect(nodes.get(2)[0]).to
			.equal(test_ground.getElementsByTagName('span')[2]);
		expect(nodes.get(-4)).to.be.undefined;
		expect(nodes.get(30)).to.be.undefined;
	});

	it('should be able to match two nodes', function() {
		var node = dom('.bread.hashtag');

		expect(node.matches('.bread')).to.be.true;
		expect(node.matches('.hashtag')).to.be.true;
		expect(node.matches('.bread.hashtag')).to.be.true;
		expect(node.matches(dom('.bread'))).to.be.true;

		expect(dom(window).matches(window)).to.be.true;
		expect(dom(window).matches('window')).to.be.true;

		expect(dom(window).matches(document.body)).to.be.false;
	});

	it('should find the closest matching ancestor', function() {
		var node = dom(test_ground).find('label'),
			par = node.closest('.bread'),
			decoy = document.createElement('DIV');

		expect(par.length()).to.equal(1);
		expect(par[0]).to.equal(test_ground.getElementsByClassName('bread')[2]);
		expect(node.closest(dom('#beans'))[0]).to.equal(dom('#beans')[0]);
		expect(node.closest('label')[0]).to.equal(node[0]);

		expect(function() {
			node.closest(decoy);
		}).to.throw('invalid selector passed to dom.closest');

		expect(node.closest('tr').length()).to.equal(0);
	});

	it('should be iterable', function() {
		var spy = sinon.spy(),
			node = dom(test_ground).find('span');

		node.each(spy);

		expect(spy.callCount).to.equal(9);
	});

	it('should fetch laterally', function() {
		var node = dom(test_ground).find('span');

		expect(node.get(5).prev('span').length()).to.equal(1);
		expect(node.get(5).prev('span')[0]).to.equal(node.get(4)[0]);
		expect(node.get(5).next('span').length()).to.equal(0);
		expect(node.get(4).next('span').length()).to.equal(1);
		expect(node.get(4).next('span')[0]).to.equal(node.get(5)[0]);

		expect(node.get(5).prevAll('span').length()).to.equal(2);
		expect(node.get(3).nextAll('span').length()).to.equal(2);
	});

	it('should return an empty object on erronious lateral fetch', function() {
		expect(dom().prev('span').length()).to.equal(0);
		expect(dom().next('span').length()).to.equal(0);
	});
});

describe('DOM manipulation library style functions', function() {
	var test_ground,
		test_dom = (
			'<div id="beans">\
				<div class="beans"></div>\
				<div class="bread hashtag"></div>\
				<div class="bread yolo"></div>\
			</div>');

	before(function() {
		test_ground = document.createElement('DIV');

		document.body.appendChild(test_ground);
	});

	beforeEach(function() {
		test_ground.innerHTML = test_dom;
	});

	after(function() {
		test_ground.parentNode.removeChild(test_ground);
		test_ground = null;
	});

	it('should add class names', function() {
		var elem = dom(test_ground).find('.beans'),
			elems = dom(test_ground).find('.bread');

		expect(elem[0].className).to.equal('beans');

		elem.addClass('pinto');

		expect(elem[0].className).to.equal('beans pinto');

		elems.addClass('gravy');

		expect(elems[0].className).to.equal('bread hashtag gravy');
		expect(elems[1].className).to.equal('bread yolo gravy');
	});

	it('should remove class names', function() {
		var elem = dom(test_ground).find('.beans'),
			elems = dom(test_ground).find('.bread');

		elem.addClass('pinto');
		elem.removeClass('pinto');

		expect(elem[0].className).to.equal('beans');

		elem.addClass('pinto');
		elem.removeClass('beans');

		expect(elem[0].className).to.equal('pinto');

		elems.removeClass('bread');
		expect(elems[0].className).to.equal('hashtag');
		expect(elems[1].className).to.equal('yolo');
	});

	it('should measure things', function() {
		var node = dom('#beans'),
			dims = node.measure();

		expect(dims.width).to.be.above(0);
		expect(dims.width).to.equal(node[0].offsetWidth);

		node = dom('<div></div>');
		dims = node.measure();

		expect(dims.width).to.equal(0);
	});
});

describe('DOM manipulation library manipulation functions', function() {
	var test_ground,
		test_dom = (
			'<div id="beans">\
				<div class="beans">\
					<span></span>\
					<span></span>\
					<span></span>\
				</div>\
				<div class="bread hashtag">\
					<span></span>\
					<span></span>\
					<span></span>\
				</div>\
				<div class="bread yolo">\
					<span></span>\
					<span></span>\
					<span>\
						<div class="bread">\
							<label>IM SOME TEXT</label>\
						</div>\
					</span>\
				</div>\
			</div>');

	before(function() {
		test_ground = document.createElement('DIV');

		document.body.appendChild(test_ground);
	});

	beforeEach(function() {
		test_ground.innerHTML = test_dom;
	});

	after(function() {
		test_ground.parentNode.removeChild(test_ground);
		test_ground = null;
	});

	it('should inject html', function() {
		var html = '<h1>WOOOO</h1>',
			node = dom(test_ground)
				.find('.beans span')
				.get(0)
				.html(html);

		expect(test_ground.getElementsByTagName('span')[0].innerHTML)
			.to.be.equal(html);
		expect(test_ground.getElementsByTagName('span')[0].innerHTML)
			.to.be.equal(node.html());
	});

	it('should inject content at the beginning', function() {
		var node = dom(test_ground)
				.find('.beans')
				.get(0),
			spans;

		node.prepend('<span class="span1"></span>');
		expect(node.find('span').length()).to.equal(4);

		node.prepend((function() {
			var span = document.createElement('span');

			span.className = 'span2';
			return span;
		})());
		expect(node.find('span').length()).to.equal(5);

		node.prepend(dom('<span class="span3"></span>'));
		expect(node.find('span').length()).to.equal(6);

		spans = node.find('span');
		expect(spans[0].className).to.equal('span3');
		expect(spans[1].className).to.equal('span2');
		expect(spans[2].className).to.equal('span1');
	});

	it('should inject content at the end', function() {
		var node = dom(test_ground)
				.find('.beans')
				.get(0),
			spans;

		node.append('<span class="span1"></span>');
		expect(node.find('span').length()).to.equal(4);

		node.append((function() {
			var span = document.createElement('span');

			span.className = 'span2';
			return span;
		})());
		expect(node.find('span').length()).to.equal(5);

		node.append(dom('<span class="span3"></span>'));
		expect(node.find('span').length()).to.equal(6);

		spans = node.find('span');
		expect(spans[5].className).to.equal('span3');
		expect(spans[4].className).to.equal('span2');
		expect(spans[3].className).to.equal('span1');
	});

	it('should insert content before a node', function() {
		var node = dom(test_ground)
				.find('.beans')
				.get(0),
			divs;

		node.before('<div class="beans coffee1"></div>');
		expect(dom(test_ground).find('.beans').length()).to.equal(2);

		node.before((function() {
			var diver = document.createElement('div');

			diver.className = 'beans coffee2';
			return diver;
		})());
		expect(dom(test_ground).find('.beans').length()).to.equal(3);

		node.before(dom('<div class="beans coffee3"></div>'));
		expect(dom(test_ground).find('.beans').length()).to.equal(4);

		divs = dom(test_ground).find('.beans');
		expect(divs[0].className).to.equal('beans coffee1');
		expect(divs[1].className).to.equal('beans coffee2');
		expect(divs[2].className).to.equal('beans coffee3');

		expect(dom('<div></div>').before('<div></div>').prev('div').length())
			.to.equal(0);

		expect(node.before()).to.equal(node);
	});

	it('should insert content after a node', function() {
		var node = dom(test_ground)
				.find('.beans')
				.get(0),
			divs;

		node.after('<div class="beans coffee1"></div>');
		expect(dom(test_ground).find('.beans').length()).to.equal(2);

		node.after((function() {
			var diver = document.createElement('div');

			diver.className = 'beans coffee2';
			return diver;
		})());
		expect(dom(test_ground).find('.beans').length()).to.equal(3);

		node.after(dom('<div class="beans coffee3"></div>'));
		expect(dom(test_ground).find('.beans').length()).to.equal(4);

		divs = dom(test_ground).find('.beans');
		expect(divs[3].className).to.equal('beans coffee1');
		expect(divs[2].className).to.equal('beans coffee2');
		expect(divs[1].className).to.equal('beans coffee3');

		expect(dom('<div></div>').after('<div></div>').prev('div').length())
			.to.equal(0);

		expect(node.after()).to.equal(node);
	});

	it('should clone nodes', function() {
		var node = dom(test_ground)
				.find('.beans')
				.get(0),
			clone = node.clone();

		expect(clone[0]).to.not.equal(node[0]);
		expect(clone[0].className).to.equal(node[0].className);
		expect(clone[0].innerHTML).to.equal(node[0].innerHTML);
	});

	it('should remove nodes', function() {
		var node = dom(test_ground)
				.find('.beans')
				.get(0),
			nodes = dom(test_ground)
				.find('.bread');

		expect(nodes.length()).to.equal(3);

		node.remove();
		nodes.get(2).remove();
		nodes.remove();

		expect(node[0].parentNode).to.be.null;
		expect(dom(test_ground).find('.beans').length()).to.equal(0);
		expect(dom(test_ground).find('.bread').length()).to.equal(0);
	});
});

describe('DOM manipulation library event wrapper', function() {
	var test_ground,
		test_dom = (
			'<div id="beans">\
				<div class="beans">\
					<span></span>\
					<span></span>\
					<span></span>\
				</div>\
				<div class="bread hashtag">\
					<span></span>\
					<span></span>\
					<span></span>\
				</div>\
				<div class="bread yolo">\
					<span></span>\
					<span></span>\
					<span>\
						<div class="bread">\
							<label>IM SOME TEXT</label>\
							<input type="text">\
						</div>\
					</span>\
				</div>\
			</div>');

	before(function() {
		test_ground = document.createElement('DIV');

		document.body.appendChild(test_ground);
	});

	beforeEach(function() {
		test_ground.innerHTML = test_dom;
	});

	after(function() {
		test_ground.parentNode.removeChild(test_ground);
		test_ground = null;
	});

	it('should fire events on the dom', function() {
		var spy = sinon.spy(),
			node = dom(test_ground).find('label'),
			decoy = dom('<div></div>');

		window.addEventListener('click', spy, false);
		node.fire('click');

		expect(spy.called).to.be.true;

		decoy.fire('click');
		expect(spy.callCount).to.equal(1);
	});

	it('should listen to events', function() {
		var node = dom(test_ground)
				.find('.bread.yolo span')
				.get(1),
			spy = sinon.spy(),
			evObj = window.document.createEvent('MouseEvent');

		evObj.initMouseEvent(
			'click',
			true,
			true,
			window,
			0,
			0,
			0,
			0,
			0,
			false,
			false,
			false,
			false,
			0,
			null
		);

		node.on('click', spy);

		node[0].dispatchEvent(evObj);

		expect(spy.callCount).to.equal(1);

		node.off('click', spy);

		node[0].dispatchEvent(evObj);

		expect(spy.callCount).to.equal(1);

		node.on('click', spy);
		node.remove();

		node[0].dispatchEvent(evObj);

		expect(spy.callCount).to.equal(1);
	});

	it('should toggle focus on inputs', function() {
		var spy1 = sinon.spy(),
			spy2 = sinon.spy(),
			node = dom(test_ground).find('input');

		node.on('focus', spy1);
		node.on('blur', spy2);

		node.focus();

		expect(spy1.callCount).to.equal(1);
		expect(spy2.callCount).to.equal(0);

		node.blur();

		expect(spy1.callCount).to.equal(1);
		expect(spy2.callCount).to.equal(1);
	});
});
