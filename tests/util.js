import { init, type, extend } from 'base/util';

describe('Utility function init', function() {
	it('should call after the document is ready', function(done) {
		init(function() {});
		init(function() {
			try {
				expect(document.body).to.exist;

				init(function() {
					try {
						expect(document.body).to.exist;

						done();
					} catch (e) {
						done(e);
					}
				});
			} catch (e) {
				done(e);
			}
		});
	});
});

describe('Utility function type', function() {
	it('should equate strings', function() {
		expect(type('im a string')).to.equal('string');
		expect(type('im a string', 'string')).to.be.true;
		expect(type({}, 'string')).to.be.false;
	});

	it('should equate undefined', function() {
		expect(type(undefined)).to.equal('undefined');
		expect(type(undefined, 'undefined')).to.be.true;
		expect(type(undefined, 'object')).to.be.false;
	});

	it('should equate booleans', function() {
		expect(type(true)).to.equal('boolean');
		expect(type(false)).to.equal('boolean');
		expect(type(true, 'boolean')).to.be.true;
		expect(type(true, 'object')).to.be.false;
	});

	it('should equate numbers', function() {
		expect(type(12)).to.equal('number');
		expect(type(12.23)).to.equal('number');
		expect(type(12.23, 'number')).to.be.true;
		expect(type('12.23', 'number')).to.be.false;
	});

	it('should equate functions', function() {
		var bread = function() {},
			pinto = new function() {};

		function beans() {}

		expect(type(beans)).to.equal('function');
		expect(type(beans, 'function')).to.be.true;
		expect(type(beans, 'object')).to.be.false;

		expect(type(bread)).to.equal('function');
		expect(type(bread, 'function')).to.be.true;
		expect(type(bread, 'object')).to.be.false;

		expect(type(pinto)).to.not.equal('function');
		expect(type(pinto, 'function')).to.be.false;
	});

	it('should equate null', function() {
		var beans = null;

		expect(type(beans)).to.equal('null');
		expect(type(beans, 'null')).to.be.true;
		expect(type(beans, 'object')).to.be.false;
	});

	it('should equate arrays', function() {
		expect(type([])).to.equal('array');
		expect(type(new Array())).to.equal('array');
		expect(type([], 'array')).to.be.true;
		expect(type([], 'object')).to.be.false;
	});

	it('should equate dates', function() {
		var date = new Date();

		expect(type(date)).to.equal('date');
		expect(type(date, 'date')).to.be.true;
		expect(type(date, 'object')).to.be.false;
	});

	it('should equate textnodes', function() {
		var beans = document.createTextNode('yolo'),
			bread = document.createElement('DIV');

		expect(type(beans)).to.equal('textnode');
		expect(type(beans, 'textnode')).to.be.true;
		expect(type(beans, 'object')).to.be.false;
		expect(type(beans, 'node')).to.be.false;
		expect(type(bread, 'textnode')).to.be.false;
	});

	it('should equate nodes', function() {
		var bread = document.createTextNode('yolo'),
			beans = document.createElement('DIV');

		expect(type(beans)).to.equal('node');
		expect(type(beans, 'node')).to.be.true;
		expect(type(window, 'node')).to.be.true;
		expect(type(beans, 'object')).to.be.false;
		expect(type(beans, 'textnode')).to.be.false;
		expect(type(bread, 'node')).to.be.false;
	});

	it('should equate objects', function() {
		var beans = {},
			bread = new function() {};

		expect(type(beans)).to.equal('object');
		expect(type(beans, 'object')).to.be.true;
		expect(type(bread, 'object')).to.be.true;
	});

	it('should take multiple matches', function() {
		expect(type([], 'array, string')).to.be.true;
		expect(type([], 'string, array')).to.be.true;

		expect(type('', 'array, string')).to.be.true;
		expect(type('', 'string, array')).to.be.true;

		expect(type({}, 'array, string')).to.be.false;
	});
});

describe('Utility function extend', function() {
	it('should return a new object', function() {
		var _in = {
				tag: 'name',
				name: 12.45
			},
			_out = extend(_in);

		expect(_out.tag).to.equal(_in.tag);
		expect(_out.name).to.equal(_in.name);

		expect(_out).to.not.equal(_in);
	});

	it('should merge two objects', function() {
		var _in1 = {
				tag: 'name1',
				name: 12.45
			},
			_in2 = {
				tag: 'name2',
				name: 24.45
			},
			_out = extend(_in1, _in2);

		expect(_out.tag).to.equal(_in2.tag);
		expect(_out.name).to.equal(_in2.name);

		expect(_out).to.not.equal(_in1);
		expect(_out).to.not.equal(_in2);
	});

	it('should mixin objects', function() {
		var _in1 = {
				name: 12.45
			},
			_in2 = {
				tag: 'name2',
				name: 24.45
			},
			_out = extend(_in1, _in2);

		expect(_out.tag).to.equal(_in2.tag);
		expect(_out.name).to.equal(_in2.name);
	});

	it('should throw an error if empty', function() {
		expect(extend).to.throw('extend called with too few parameters');
	});

	it('should ignore giberish', function() {
		var _out = extend({
			beans: 24
		},
		function() {},
		null,
		'imma string!',
		24.57, {
			beans: 65.2
		});

		expect(Object.keys(_out).length).to.equal(1);
		expect(_out.beans).to.equal(65.2);
	});
});
