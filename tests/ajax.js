import Ajax from 'base/ajax';

describe('Ajax normalizing module', function() {
	var server;

	before(function() {
		server = sinon.fakeServer.create();
		server.autoRespond = true;
	});

	after(function() {
		server.restore();
	});

	afterEach(function() {
		Ajax.clear_mocks();
	});

	it('should make a successful get request', function(done) {
		var success = sinon.spy(),
			error = sinon.spy();

		server.respondWith(
			[
				200,
				{ 'Content-Type': 'application/json' },
				'[{ "id": 12, "comment": "hashtag yolo" }]'
			]
		);

		Ajax({
			url: '/test',
			method: 'GET',
			success: success,
			error: error
		});

		server.respond();

		setTimeout(function() {
			try {
				expect(error.called).to.be.false;
				expect(success.called).to.be.true;

				done();
			} catch (e) {
				done(e);
			}
		}, 10);
	});

	it('should make a failed request', function(done) {
		var success = sinon.spy(),
			error = sinon.spy();

		server.respondWith(
			[
				503,
				{ 'Content-Type': 'application/json' },
				'[{ "id": 12, "comment": "hashtag yolo" }]'
			]
		);

		Ajax({
			url: '/test',
			method: 'GET',
			success: success,
			error: error
		});

		server.respond();

		setTimeout(function() {
			try {
				expect(error.called).to.be.true;
				expect(success.called).to.be.false;

				done();
			} catch (e) {
				done(e);
			}
		}, 10);
	});

	it('should convert query strings correctly', function(done) {
		var success = sinon.spy(),
			error = sinon.spy();

		server.respondWith(function(req) {
			var params = req.url
				.slice((window.location.origin + '/test').length);

			try {
				expect(params[0]).to.equal('?');

				params = params.slice(1);

				expect(params.indexOf('?')).to.equal(-1);

				params = decodeURI(params).split('&');

				expect(params.length).to.equal(5);
				expect(params[0]).to.equal('hashtag=yolo');
				expect(params[1]).to.equal('beans[]=pinto');
				expect(params[2]).to.equal('beans[]=37');
				expect(params[3]).to.equal('sunshine[flowers]=true');
				expect(params[4]).to.equal('sunshine[frowns]=false');

				done();
			} catch (e) {
				done(e);
			}
		});

		expect(Ajax.bind(Ajax, {
			url: '/test',
			method: 'GET',
			data: [
				'beans',
				12,
				false
			]
		})).to.throw('Sorry buddy, your object is wrong' +
			'and you should feel bad');

		Ajax({
			url: '/test',
			method: 'GET',
			data: {
				hashtag: 'yolo',
				beans: [ 'pinto', 37 ],
				sunshine: {
					flowers: true,
					frowns: false
				}
			},
			success: success,
			error: error
		});

		server.respond();
	});

	it('should intercept requests with mocks', function(done) {
		var spy1 = sinon.spy(),
			spy2 = sinon.spy(function(id, name, data, cb) {
				cb(200, { id: 12, beans: 'pinto' });
			}),
			on_error = sinon.spy(),
			on_success = sinon.spy();

		server.respondWith(spy1);

		expect(Ajax.mock.bind(Ajax.mock, {
			method: 'GET',
			callback() {}
		})).to.throw('Ajax.mock called without url parameter');

		Ajax.mock({
			url: '/test/:id/:name',
			callback: spy2
		});

		Ajax({
			url: '/test/14/frank',
			method: 'GET',
			data: {
				beans: 12
			},
			success: on_success,
			error: on_error
		});

		server.respond();

		setTimeout(function() {
			try {
				expect(spy1.called).to.be.false;
				expect(spy2.called).to.be.true;

				expect(spy2.args[0].length).to.equal(4);
				expect(spy2.args[0][0]).to.equal(14);
				expect(spy2.args[0][1]).to.equal('frank');
				expect(spy2.args[0][2]).to.eql({ beans: 12 });

				expect(on_error.called).to.be.false;
				expect(on_success.callCount).to.equal(1);
				expect(on_success.args[0][0])
					.to.eql({ id: 12, beans: 'pinto' });

				done();
			} catch (e) {
				done(e);
			}
		}, 10);
	});

	it('should support mocking errors', function(done) {
		var spy = sinon.spy(function(id, name, data, cb) {
				cb(404, 'YOU SUCK');
			}),
			on_error = sinon.spy(),
			on_success = sinon.spy();

		Ajax.mock({
			url: '/test/:id/:name',
			callback: spy
		});

		Ajax({
			url: '/test/14/frank',
			method: 'GET',
			data: {
				beans: 12
			},
			success: on_success,
			error: on_error
		});

		setTimeout(function() {
			try {
				expect(spy.called).to.be.true;

				expect(on_error.callCount).to.equal(1);
				expect(on_error.args[0][0]).to.eql('YOU SUCK');

				done();
			} catch (e) {
				done(e);
			}
		}, 10);
	});

	it('should ignore empty mocks', function(done) {
		var spy = sinon.spy();

		server.respondWith(spy);

		Ajax.mock({
			url: '/test/:id'
		});

		Ajax.mock({
			url: '/test/frank',
			method: 'POST',
			callback() {}
		});

		Ajax.mock({
			url: '/test/jones',
			callback() {}
		});

		Ajax({
			url: '/test/frank',
			method: 'GET',
			data: {
				beans: 12
			}
		});

		server.respond();

		setTimeout(function() {
			try {
				expect(spy.called).to.be.true;

				done();
			} catch (e) {
				done(e);
			}
		}, 10);
	});

	it('should allow one mock per url', function() {
		Ajax.mock({
			url: '/test/:id',
			callback() {}
		});

		expect(Ajax.mock.bind(Ajax.mock, {
			url: '/test/:id',
			method: 'GET',
			callback() {}
		})).to.throw('Ajax.mock: overwritting mock with /test/:id');
	});

	it('should ignore GET params in a POST mock', function(done) {
		var spy1 = sinon.spy(),
			spy2 = sinon.spy();

		server.respondWith(spy1);

		Ajax.mock({
			url: '/test/beans',
			method: 'post',
			callback: spy2
		});

		Ajax({
			url: '/test/beans?hashtag=yolo',
			method: 'post',
			data: {
				beans: 12
			}
		});

		server.respond();

		setTimeout(function() {
			try {
				expect(spy1.called).to.be.false;
				expect(spy2.called).to.be.true;

				done();
			} catch (e) {
				done(e);
			}
		}, 10);
	});

	it('should call a function before every call', function(done) {
		var spy1 = sinon.spy(),
			spy2 = sinon.spy(),
			server_spy = sinon.spy();

		server.respondWith(server_spy);

		Ajax.before('giberish');
		Ajax.before(spy1);
		Ajax.before(spy2);

		Ajax({
			url: '/totes'
		});

		Ajax({
			url: '/mc'
		});

		Ajax({
			url: '/goats?beans=12',
			data: {
				type: 'pinto'
			}
		});

		server.respond();

		setTimeout(function() {
			try {
				expect(spy1.callCount).to.equal(3);
				expect(spy2.callCount).to.equal(3);

				done();
			} catch (e) {
				done(e);
			}
		}, 10);
	});

	it('should make a sussessful post request', function(done) {
		var serve = sinon.spy(function(req) {
				req.respond(
					200,
					{ 'Content-Type': 'application/json' },
					'[{ "id": 12, "comment": "hashtag jollo" }]'
				);
			}),
			success = sinon.spy(),
			error = sinon.spy();

		server.respondWith(serve);

		Ajax({
			url: '/test',
			method: 'POST',
			data: {
				id: 12,
				users: [
					{ name: 'steve' },
					{ name: 'bob' }
				]
			},
			success: success,
			error: error
		});

		setTimeout(function() {
			var expected = encodeURI(
				'id=12&users[][name]=steve&users[][name]=bob'
			);

			try {
				expect(serve.args[0][0].requestBody)
					.to.equal(expected);
				expect(error.called).to.be.false;
				expect(success.called).to.be.true;

				done();
			} catch (e) {
				done(e);
			}
		}, 10);
	});
});
