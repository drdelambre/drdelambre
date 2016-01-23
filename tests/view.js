import dom from 'base/dom';
import View from 'base/view';

describe('View module', function() {
	var test_ground;

	before(function() {
		test_ground = dom('<div id="test-ground"></div>');
		dom(document.body).append(test_ground);
	});

	afterEach(function() {
		test_ground.html('');
	});

	after(function() {
		test_ground.remove();
		test_ground = null;
	});

	it('should backfill the element property', function() {
		var view = new View({
				id: 12,
				beans: 'pinto'
			}),
			div = dom('<div></div>');

		expect(view._def.hasOwnProperty('element')).to.be.true;

		view = new View({
			element: div,

			id: 12,
			beans: 'pinto'
		});

		expect(view._def.element.value).to.equal(div);
	});

	it('should cry about tying bad variables', function() {
		var view = new View({
			element: dom('<div></div>'),

			id: 12,
			beans: 'pinto'
		});

		expect(function() {
			view.render({
				hashtag() {}
			});
		}).to.throw('View: called render on a property (' +
					'hashtag) that does not exist');
	});

	it('should initialize with a script template', function(done) {
		var spy = sinon.spy(),
			beans;

		test_ground.append(
			'<script id="template" type="text/html">\
				<div class="beans">\
					<h1>YOLO COOL KIDS</h1>\
				</div>\
			</script>');

		beans = new View({
			template: '#template'
		})
		.render({
			element: spy
		});

		setTimeout(function() {
			try {
				expect(dom('.beans')._len).to.equal(0);
				expect(spy.callCount).to.equal(1);
				expect(beans.element).to.exist;
				expect(beans.element.matches('.beans')).to.be.true;
				expect(beans.element.find('h1').html())
					.to.equal('YOLO COOL KIDS');

				done();
			} catch (e) {
				done(e);
			}
		}, 30);
	});

	it('should cry about bad templates', function() {
		test_ground.append(
			'<script id="template" type="text/html">\
				<div class="beans"></div>\
				<h1>YOLO COOL KIDS</h1>\
			</script>');

		expect(function() {
			new View({
				template: '#yolo-beans',
				id: 12,
				beans: 'pinto'
			});
		}).to.throw('View: template (#yolo-beans) does not exist');

		expect(function() {
			new View({
				template: '#template',
				id: 12,
				beans: 'pinto'
			});
		}).to.throw('View: template (#template) is more than one element');
	});

	it('should call render functions on assignment', function(done) {
		var spy = sinon.spy(),
			view = new View({
				element: dom('<div></div>'),

				id: 12,
				beans: 'pinto'
			})
			.render({
				beans: spy
			});

		//give the dom some time to load
		setTimeout(function() {
			expect(spy.callCount).to.equal(1);

			view.beans = 'kidney';
			setTimeout(function() {
				try {
					expect(spy.callCount).to.equal(2);
					done();
				} catch (e) {
					done(e);
				}
			}, 50);
		}, 20);
	});

	it('should not call render functions without an element', function(done) {
		var spy = sinon.spy(),
			view = new View({
				id: 12,
				beans: 'pinto'
			})
			.render({
				beans: spy
			});

		expect(spy.callCount).to.equal(0);

		view.beans = 'kidney';
		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(0);
				done();
			} catch (e) {
				done(e);
			}
		}, 50);
	});

	// it('should have tests', function() {
	// 	expect(false).to.be.true;
	// });
});
