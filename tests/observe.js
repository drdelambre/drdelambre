import Observer from 'base/observe';

describe('Observer helper', function() {
	it('should fire callbacks when requested', function() {
		var o = Observer(),
			spy1 = sinon.spy(),
			spy2 = sinon.spy();

		o(spy1);
		o(spy2);

		o.fire();

		expect(spy1.callCount).to.equal(1);
		expect(spy2.callCount).to.equal(1);
	});

	it('should allow callback removal', function() {
		var o = Observer(),
			spy1 = sinon.spy(),
			spy2 = sinon.spy();

		o(spy1);
		o(spy2);

		o.remove(spy1);

		o.fire();

		expect(spy1.callCount).to.equal(0);
		expect(spy2.callCount).to.equal(1);
	});

	it('should allow clearing all callbacks', function() {
		var o = Observer(),
			spy1 = sinon.spy(),
			spy2 = sinon.spy();

		o(spy1);
		o(spy2);

		o.clear();

		o.fire();

		expect(spy1.callCount).to.equal(0);
		expect(spy2.callCount).to.equal(0);
	});

	it('should allow polymorphic callback params', function() {
		var o = Observer(),
			spy1 = sinon.spy(),
			spy2 = sinon.spy();

		o(spy1);
		o(spy2);

		o.fire(12, 'beans', function() {});

		expect(spy1.callCount).to.equal(1);
		expect(spy2.callCount).to.equal(1);

		expect(spy1.args[0][0]).to.equal(12);
		expect(spy1.args[0][1]).to.equal('beans');
		expect(typeof spy1.args[0][2]).to.equal('function');
	});

	it('should reject garbage', function() {
		var o = Observer(),
			spy1 = sinon.spy();

		o(spy1);
		o('yolo');

		o.fire();

		o.remove(function() {});

		expect(spy1.callCount).to.equal(1);
	});
});
