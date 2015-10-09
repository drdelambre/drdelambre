import { init } from 'base/util';
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
		test_ground.append(
			'<script id="template" type="text/html">\
				<div class="beans">\
					<h1>YOLO COOL KIDS</h1>\
				</div>\
			</script>');

		var spy = sinon.spy(),
			view = new View({
				template: '#template'
			})
			.render({
				element: spy
			});

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(1);
				expect(dom('.beans')._len).to.equal(0);
				expect(view.element.matches('.beans')).to.be.true;
				// expect(view.element.find('h1').html())
				// 	.to.equal('YOLO COOL KIDS');

				done();
			} catch (e) {
				done(e);
			}
		}, 30);
	});

	// it('should have tests', function() {
	// 	expect(false).to.be.true;
	// });
});
