import toggle from 'base/toggle';

describe('Toggle helper', function() {
	it('should toggle between open and closed', function() {
		var t = toggle();

		expect(t.isOpen).to.be.false;

		t();
		expect(t.isOpen).to.be.true;

		t();
		expect(t.isOpen).to.be.false;
	});

	it('should call the open function when opening', function() {
		var spy = sinon.spy(),
			t = toggle(spy);

		t.isOpen = true;
		t();

		expect(spy.callCount).to.equal(0);

		t();
		expect(spy.callCount).to.equal(1);

		t.open();
		expect(spy.callCount).to.equal(1);

		t.isOpen = false;
		t.open();
		expect(spy.callCount).to.equal(2);
	});

	it('should call the close function when closing', function() {
		var spy = sinon.spy(),
			t = toggle(null, spy);

		t.isOpen = false;
		t();

		expect(spy.callCount).to.equal(0);

		t();
		expect(spy.callCount).to.equal(1);

		t.close();
		expect(spy.callCount).to.equal(1);

		t.isOpen = true;
		t.close();
		expect(spy.callCount).to.equal(2);
	});
});
