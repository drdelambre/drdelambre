import { pub, sub, unsub, channels, clear } from 'base/pubsub';

function split_console(str) {
	return str.slice('Subscribed Channels:\n\t'.length).split('\n\t');
}

describe('Publish/Subscribe', function() {
	beforeEach(function() {
		clear();
		sinon.stub(console, 'log');
	});

	afterEach(function() {
		console.log.restore();	//eslint-disable-line
	});

	it('should not register empty callbacks', function() {
		var out;

		sub('/beans');

		channels();

		out = split_console(console.log.args[0][0]);	//eslint-disable-line

		expect(out.length).to.equal(1);
		expect(out[0]).to.equal('');
	});

	it('should register callbacks', function() {
		var out;

		sub('/beans', function() {});
		sub('/hashtag/yolo', function() {});

		channels();

		out = split_console(console.log.args[0][0]);	//eslint-disable-line

		expect(out.length).to.equal(2);
		expect(out[0]).to.equal('/beans');
		expect(out[1]).to.equal('/hashtag/yolo');
	});

	it('should register multiple callbacks per channel', function() {
		var out;

		sub('/beans', function() {});
		sub('/beans', function() {});

		channels();

		out = split_console(console.log.args[0][0]);	//eslint-disable-line

		expect(out.length).to.equal(1);
		expect(out[0]).to.equal('/beans');
	});

	it('should not call the wrong channel', function() {
		var spy = sinon.spy();

		sub('/beans', spy);
		pub('/bread');

		expect(spy.callCount).to.equal(0);
	});

	it('should call multiple callbacks per channel', function(done) {
		var func = (function(on_done) {
			var i = 0,
				spies = [];

			return function() {
				var spy = sinon.spy(function() {
					if (--i) {
						return;
					}

					on_done(spies);
				});

				spies.push(spy);
				i++;

				return spy;
			};
		})(function(spies) {
			try {
				expect(spies.length).to.equal(2);
				done();
			} catch (e) {
				done(e);
			}
		});

		sub('/beans', func());
		sub('/beans', func());

		pub('/beans');
	});

	it('should pass a variable number of parameters', function(done) {
		var func = (function(on_done) {
			var i = 2;

			return sinon.spy(function() {
				if (--i) {
					return;
				}

				on_done();
			});
		})(function() {
			try {
				expect(func.callCount).to.equal(2);

				expect(func.args[0].length).to.equal(2);
				expect(func.args[1].length).to.equal(1);

				expect(func.args[0][0]).to.equal(12);
				expect(func.args[0][1]).to.equal('hashtag');

				expect(func.args[1][0]).to.equal('yolo');

				done();
			} catch (e) {
				done(e);
			}
		});

		sub('/beans', func);

		pub('/beans', 12, 'hashtag');
		pub('/beans', 'yolo');
	});

	it('should accept parameterized paths', function() {
		var out;

		sub('/beans/:id/:name/update', function() {});

		channels();

		out = split_console(console.log.args[0][0]);	//eslint-disable-line

		expect(out.length).to.equal(1);
		expect(out[0]).to.equal('/beans/:id/:name/update');
	});

	it('should not honor parameterized path order', function() {
		var out;

		sub('/beans/:id/:name/update', function() {});
		sub('/beans/:name/:id/update', function() {});

		channels();

		out = split_console(console.log.args[0][0]);	//eslint-disable-line

		expect(out.length).to.equal(1);
		expect(out[0]).to.equal('/beans/:id/:name/update');
	});

	it('should inject path variables', function(done) {
		var update = {
			score: 12
		};

		sub('/beans/:id/:name/update', function(...args) {
			try {
				expect(args.length).to.equal(3);
				expect(args[0]).to.equal(12);
				expect(args[1]).to.equal('pinto');
				expect(args[2]).to.equal(update);

				done();
			} catch (e) {
				done(e);
			}
		});
		pub('/beans/12/pinto/update', update);
	});

	it('should match multiple parameterized paths', function(done) {
		var update = {
				score: 12
			},
			func = (function(on_done) {
				var i = 0,
					spies = [];

				return function() {
					var spy = sinon.spy(function() {
						if (--i) {
							return;
						}

						on_done(spies);
					});

					spies.push(spy);
					i++;

					return spy;
				};
			})(function(spies) {
				try {
					expect(spies.length).to.equal(2);
					expect(spies[0].args[0].length).to.equal(2);
					expect(spies[1].args[0].length).to.equal(3);

					expect(spies[0].args[0][0]).to.equal(12);
					expect(spies[0].args[0][1]).to.equal(update);

					expect(spies[1].args[0][0]).to.equal(12);
					expect(spies[1].args[0][1]).to.equal('update');
					expect(spies[1].args[0][2]).to.equal(update);

					done();
				} catch (e) {
					done(e);
				}
			});

		sub('/beans/:id/update', func());
		sub('/beans/:id/:action', func());

		pub('/beans/12/update', update);
	});

	it('should love the star', function(done) {
		var spy = sinon.spy();

		sub('*', spy);

		pub('/beans', 12, 'cheese');
		pub('/yolo');
		pub('/hashtag/meme/juice');

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(3);
				done();
			} catch (e) {
				done(e);
			}
		}, 5);
	});

	it('should accept optional parameters', function(done) {
		var spy = sinon.spy();

		sub('beans/:id?/yolo', spy);

		pub('beans/12/yolo');
		pub('beans/yolo');

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(2);
				expect(spy.args[0][0]).to.equal(12);
				expect(spy.args[1].length).to.equal(1);
				expect(spy.args[1][0]).to.be.undefined;

				done();
			} catch (e) {
				done(e);
			}
		}, 5);
	});

	it('should deregister callbacks from channels', function(done) {
		var spy1 = sinon.spy(),
			spy2 = sinon.spy(function() {
				try {
					expect(spy1.callCount).to.equal(0);
					expect(spy2.callCount).to.equal(1);

					done();
				} catch (e) {
					done(e);
				}
			});

		sub('/beans', spy1);
		sub('/beans', spy2);

		unsub('/beans', spy1);
		unsub('/beans', function() {});
		unsub('beans', spy2);

		pub('/beans');
	});
});
