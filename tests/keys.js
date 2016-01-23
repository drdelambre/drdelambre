import Keys from 'base/keys';

function KeyEvent(which, up = 'down') {
	var type = up === 'up' ? 'keyup' : 'keydown',
		e, eInit;

	if (typeof KeyboardEvent === 'function') {
		e = new KeyboardEvent(type, {
			bubbles: true,
			cancelable: true
		});
	} else {
		e = document.createEvent('KeyboardEvent');
		eInit = typeof e.initKeyboardEvent !== 'undefined' ?
			'initKeyboardEvent' : 'nitKeyEvent';

		e[eInit](
			type,
			true,
			true,
			window,
			false,
			false,
			false,
			false,
			which,
			0
		);
	}

	delete e.key;
	Object.defineProperty(e, 'key', { 'value': which });

	document.dispatchEvent(e);
}

describe('Key combination service', function() {
	it('should be a service', function() {
		expect(function() {
			new Keys();
		}).to.throw(
			'Keys: This modules is set up as a service, ' +
			'remove the `new` keyword');
	});

	it('should handle a single key press', function() {
		var spy = sinon.spy();

		Keys({
			'up': spy
		});

		Keys({
			'down': 'yolo'
		});

		KeyEvent(38);
		KeyEvent(38, 'up');

		KeyEvent(40);
		KeyEvent(40, 'up');

		expect(spy.callCount).to.equal(1);
	});

	it('should handle a key press sequences', function() {
		var spy = sinon.spy();

		Keys({
			'up + down + left + right': spy
		});

		KeyEvent(38);
		KeyEvent(38, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(40);
		KeyEvent(40, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(37);
		KeyEvent(37, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(39);
		KeyEvent(39, 'up');
		expect(spy.callCount).to.equal(1);
	});

	it('should be canceled by wrong presses', function() {
		var spy = sinon.spy();

		Keys({
			'up + down + left + right': spy
		});

		KeyEvent(38);
		KeyEvent(38, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(40);
		KeyEvent(40, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(40);
		KeyEvent(40, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(40);
		KeyEvent(40, 'up');
		expect(spy.callCount).to.equal(0);
	});

	it('should normalize numbers', function() {
		var spy = sinon.spy();

		Keys({
			'1 + 2 + 3 + 4': spy
		});

		KeyEvent(97);
		KeyEvent(97, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(50);
		KeyEvent(50, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(99);
		KeyEvent(99, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(52);
		KeyEvent(52, 'up');
		expect(spy.callCount).to.equal(1);
	});

	it('should apply for a short window', function(done) {
		var spy = sinon.spy();

		Keys({
			'up + down + left + right': spy
		});

		KeyEvent(38);
		KeyEvent(38, 'up');

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(0);

				KeyEvent(40);
				KeyEvent(40, 'up');

				expect(spy.callCount).to.equal(0);

				KeyEvent(37);
				KeyEvent(37, 'up');

				expect(spy.callCount).to.equal(0);

				KeyEvent(39);
				KeyEvent(39, 'up');

				expect(spy.callCount).to.equal(1);

				done();
			} catch (e) {
				done(e);
			}
		}, 400);
	});

	it('should only apply for a short window', function(done) {
		var spy = sinon.spy();

		Keys({
			'up + down + left + right': spy
		});

		KeyEvent(38);
		KeyEvent(38, 'up');

		expect(spy.callCount).to.equal(0);

		KeyEvent(40);
		KeyEvent(40, 'up');

		expect(spy.callCount).to.equal(0);

		KeyEvent(37);
		KeyEvent(37, 'up');

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(0);

				KeyEvent(39);
				KeyEvent(39, 'up');

				expect(spy.callCount).to.equal(0);

				done();
			} catch (e) {
				done(e);
			}
		}, 600);
	});

	it('should handle a hold and key press sequence', function() {
		var spy = sinon.spy();

		Keys({
			'[ up + space ][ left + down + right ]': spy
		});

		KeyEvent(38);
		expect(spy.callCount).to.equal(0);

		KeyEvent(32);
		expect(spy.callCount).to.equal(0);

		KeyEvent(37);
		KeyEvent(37, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(40);
		KeyEvent(40, 'up');
		expect(spy.callCount).to.equal(0);

		KeyEvent(39);
		KeyEvent(39, 'up');

		expect(spy.callCount).to.equal(1);
	});
});
