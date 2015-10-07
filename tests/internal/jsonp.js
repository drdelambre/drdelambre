import createJSONP from 'base/internal/jsonp';

describe('The JSONP back route', function() {
	it('should initialize correctly', function(done) {
		var script_tags = document.head.getElementsByTagName('script').length,
			network = createJSONP(),
			on_error, on_success,
			script;

		function finish() {
			try {
				expect(on_success.called).to.be.true;
				expect(on_success.args[0][0]).to.eql({
					id: 12,
					beans: 'yolo'
				});

				expect(window._ajaxCallbacks[network._options.key])
					.to.be.undefined;
				expect(document.head.getElementsByTagName('script').length)
					.to.equal(script_tags);

				done();
			} catch (e) {
				done(e);
			}
		}

		on_error = sinon.spy(finish);
		on_success = sinon.spy(finish);

		network.onreadystatechange = function() {
			if (network.readyState !== 4) {
				return;
			}

			if (network.status !== 200) {
				on_error(network.response);
			}

			if (network.status === 200) {
				on_success(network.response);
			}
		};

		expect(window._ajaxCallbacks).to.be.undefined;

		network.open('GET', '/beans');
		network._options.key = 'jsonp_ABCD';

		expect(document.head.getElementsByTagName('script').length)
			.to.equal(script_tags + 1);
		expect(network.overrideMimeType()).to.be.undefined;
		expect(network.getAllResponseHeaders()).to.be.undefined;
		expect(network.getResponseHeader()).to.be.undefined;
		expect(network.setRequestHeader()).to.be.undefined;

		script = [].reverse.call(
			document.head.getElementsByTagName('script'))[0];

		network.send();
		expect(Object.keys(window._ajaxCallbacks).length).to.equal(1);
		expect(window._ajaxCallbacks[network._options.key]).to.exist;

		expect(script.src).to.equal(
			window.location.origin +
			'/beans?callback=window._ajaxCallbacks.' +
			network._options.key
		);
	});

	it('should call its error state', function(done) {
		var script_tags = document.head.getElementsByTagName('script').length,
			network = createJSONP(),
			on_error, on_success;

		function finish() {
			try {
				expect(on_error.called).to.be.true;
				expect(window._ajaxCallbacks[network._options.key])
					.to.be.undefined;
				expect(document.head.getElementsByTagName('script').length)
					.to.equal(script_tags);

				done();
			} catch (e) {
				done(e);
			}
		}

		on_error = sinon.spy(finish);
		on_success = sinon.spy(finish);

		network.onreadystatechange = function() {
			if (network.readyState !== 4) {
				return;
			}

			if (network.status !== 200) {
				on_error(network.response);
			}

			if (network.status === 200) {
				on_success(network.response);
			}
		};

		network.open('GET', '/pinto?yolo=full');
		network.send();
		expect(network._options.script.src).to.equal(
			window.location.origin +
			'/pinto?yolo=full&callback=window._ajaxCallbacks.' +
			network._options.key);
	});

	it('should be abortable', function() {
		var network = createJSONP(),
			spy = sinon.spy();

		network.open('GET', '/beans');
		network._options.key = 'jsonp_ABCD';

		network.abort();

		expect(network._options.script).to.exist;
		network.onreadystatechange = spy;

		network.send();
		network.abort();

		expect(network._options.script).to.not.exist;
		expect(spy.callCount).to.equal(2);
	});
});
