import { type } from 'base/util';
import Model from 'base/model';
import MagicArray from 'base/internal/magic-array';

class SubModel extends Model {
	constructor(data) {
		super({
			id: 12,
			name: 'yolo',
			beans: false
		});

		this.fill(data);
	}
}

describe('The magic model', function() {
	it('should be a class', function() {
		expect(Model).to.throw('Cannot call a class as a function');
	});

	it('should populate keys with properties', function() {
		var model = new Model({
				id: 12,
				name: 'beans'
			}),
			keys = model.keys();

		expect(keys.length).to.equal(2);
		expect(keys[0]).to.equal('id');
		expect(keys[1]).to.equal('name');
	});

	it('should populate inherited keys with properties', function() {
		var model = new SubModel(),
			keys = model.keys();

		expect(keys.length).to.equal(3);
		expect(keys[0]).to.equal('id');
		expect(keys[1]).to.equal('name');
		expect(keys[2]).to.equal('beans');
	});

	it('should ignore blacklisted properties', function() {
		var model = new Model({
				id: 12,
				fill() {},
				out: ''
			}),
			keys = model.keys();

		expect(keys.length).to.equal(1);
		expect(keys[0]).to.equal('id');
	});

	it('should fill default values', function() {
		var model = new Model({
			id: 12,
			name: 'beans',
			yolo: true
		});

		expect(model.id).to.equal(12);
		expect(model.name).to.equal('beans');
		expect(model.yolo).to.be.true;
	});

	it('should fill basic data', function() {
		var model = new Model({
			id: 12,
			name: 'beans',
			yolo: true
		});

		model.fill({
			name: 'not beans',
			yolo: false,
			num: 100
		});

		expect(model.id).to.equal(12);
		expect(model.name).to.equal('not beans');
		expect(model.yolo).to.be.false;
		expect(model.num).to.be.undefined;
	});

	it('should clear basic data', function() {
		var model = new Model({
			id: 12,
			name: 'beans',
			yolo: true
		});

		model.fill({
			id: 100,
			name: 'not beans',
			yolo: false,
			num: 100
		});

		model.clear();

		expect(model.id).to.equal(12);
		expect(model.name).to.equal('beans');
		expect(model.yolo).to.be.true;
	});

	it('should extend with ease', function() {
		var model = new Model({
			id: 12,
			name: 'beans'
		});

		expect(model.keys().length).to.equal(2);

		model.extend({
			yolo: false,
			num: 100
		});

		expect(model.keys().length).to.equal(4);
		expect(model.yolo).to.be.false;
		expect(model.num).to.equal(100);
	});

	it('should serialize on out', function() {
		var model = new Model({
				id: 12,
				name: 'beans'
			}),
			out;

		out = model.out();

		expect(Object.keys(out).length).to.equal(2);
		expect(out.id).to.equal(12);
		expect(out.name).to.equal('beans');

		model.extend({
			yolo: true,
			num: 100
		}).fill({
			id: 25,
			name: 'not beans',
			yolo: false,
			num: 'cool'
		});

		out = model.out();

		expect(Object.keys(out).length).to.equal(4);
		expect(out.id).to.equal(25);
		expect(out.name).to.equal('not beans');
		expect(out.yolo).to.be.false;
		expect(out.num).to.equal('cool');
	});

	it('should throw events correctly on assignment', function(done) {
		var model = new Model({
				id: 12,
				name: 'beans'
			}),
			spy1 = sinon.spy(),
			spy2 = sinon.spy();

		model.on_update('id', spy1);
		model.on_update('*', spy2);

		model.id = 12;
		model.id = 'beans';
		model.id = 56;

		model.name = 'pinto';

		setTimeout(function() {
			try {
				expect(spy1.callCount).to.equal(1);
				expect(spy2.callCount).to.equal(1);

				expect(spy1.args[0][0].old).to.equal(12);
				expect(spy1.args[0][0].new).to.equal(56);

				done();
			} catch (e) {
				done(e);
			}
		}, 11);
	});

	it('should throw events correctly on fill', function(done) {
		var model = new Model({
				id: 12,
				name: 'beans'
			}),
			spy1 = sinon.spy(),
			spy2 = sinon.spy();

		model.on_update('id', spy1);
		model.on_update('*', spy2);

		model.fill({
			id: 56,
			name: 'pinto'
		});

		setTimeout(function() {
			try {
				expect(spy1.callCount).to.equal(1);
				expect(spy2.callCount).to.equal(1);

				expect(spy1.args[0][0].old).to.equal(12);
				expect(spy1.args[0][0].new).to.equal(56);

				done();
			} catch (e) {
				done(e);
			}
		}, 11);
	});

	it('should throw events correctly on clear', function(done) {
		var model = new Model({
				id: 12,
				name: 'beans'
			}),
			spy = sinon.spy();

		model.on_update('id', spy);

		model.fill({
			id: 56,
			name: 'pinto'
		});

		setTimeout(function() {
			model.clear();

			setTimeout(function() {
				try {
					expect(spy.callCount).to.equal(2);

					expect(spy.args[1][0].old).to.equal(56);
					expect(spy.args[1][0].new).to.equal(12);

					done();
				} catch (e) {
					done(e);
				}
			}, 11);
		}, 11);
	});
});

describe('The magic model with arrays', function() {
	it('should allow arrays as default values', function() {
		var model = new Model({
			beans: []
		});

		expect(type(model._def.beans.default)).to.equal('array');
		expect(model.beans instanceof MagicArray).to.be.true;
	});

	it('should update on array assignment', function(done) {
		var model = new Model({
				beans: []
			}),
			spy = sinon.spy();

		model.on_update('beans', spy);

		model.beans = [ 1, 2, 3 ];

		expect(model.beans.length).to.equal(3);
		expect(model.beans[0]).to.equal(1);
		expect(model.beans[1]).to.equal(2);
		expect(model.beans[2]).to.equal(3);

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(1);

				expect(spy.args[0][0].new[0]).to.equal(1);
				expect(spy.args[0][0].new[1]).to.equal(2);
				expect(spy.args[0][0].new[2]).to.equal(3);

				done();
			} catch (e) {
				done(e);
			}
		}, 11);
	});

	it('should update on pushing', function(done) {
		var model = new Model({
				beans: []
			}),
			spy = sinon.spy();

		model.on_update('beans', spy);

		model.beans.push(1);

		expect(model.beans.length).to.equal(1);
		expect(model.beans[0]).to.equal(1);

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(1);

				expect(spy.args[0][0].new.length).to.equal(1);
				expect(spy.args[0][0].new[0]).to.equal(1);

				done();
			} catch (e) {
				done(e);
			}
		}, 11);
	});

	it('should update on poping', function(done) {
		var model = new Model({
				beans: []
			}),
			spy = sinon.spy();

		model.on_update('beans', spy);

		model.beans = [ 1, 2, 3 ];
		model.beans.pop();

		expect(model.beans.length).to.equal(2);
		expect(model.beans[0]).to.equal(1);
		expect(model.beans[1]).to.equal(2);

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(1);

				expect(spy.args[0][0].new.length).to.equal(2);
				expect(spy.args[0][0].new[0]).to.equal(1);
				expect(spy.args[0][0].new[1]).to.equal(2);

				done();
			} catch (e) {
				done(e);
			}
		}, 11);
	});

	it('should update on shifting', function(done) {
		var model = new Model({
				beans: []
			}),
			spy = sinon.spy();

		model.on_update('beans', spy);

		model.beans = [ 1, 2, 3 ];
		model.beans.shift();

		expect(model.beans.length).to.equal(2);
		expect(model.beans[0]).to.equal(2);
		expect(model.beans[1]).to.equal(3);

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(1);

				expect(spy.args[0][0].new.length).to.equal(2);
				expect(spy.args[0][0].new[0]).to.equal(2);
				expect(spy.args[0][0].new[1]).to.equal(3);

				done();
			} catch (e) {
				done(e);
			}
		}, 11);
	});

	it('should update on unshifting', function(done) {
		var model = new Model({
				beans: []
			}),
			spy = sinon.spy();

		model.on_update('beans', spy);

		model.beans = [ 1, 2, 3 ];
		model.beans.unshift(7, 6, 5);

		expect(model.beans.length).to.equal(6);
		expect(model.beans[0]).to.equal(7);
		expect(model.beans[1]).to.equal(6);
		expect(model.beans[2]).to.equal(5);
		expect(model.beans[3]).to.equal(1);
		expect(model.beans[4]).to.equal(2);
		expect(model.beans[5]).to.equal(3);

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(1);

				expect(spy.args[0][0].new.length).to.equal(6);
				expect(spy.args[0][0].new[0]).to.equal(7);
				expect(spy.args[0][0].new[1]).to.equal(6);
				expect(spy.args[0][0].new[2]).to.equal(5);
				expect(spy.args[0][0].new[3]).to.equal(1);
				expect(spy.args[0][0].new[4]).to.equal(2);
				expect(spy.args[0][0].new[5]).to.equal(3);

				done();
			} catch (e) {
				done(e);
			}
		}, 11);
	});

	it('should update on splicing', function(done) {
		var model = new Model({
				beans: []
			}),
			spy = sinon.spy();

		model.on_update('beans', spy);

		model.beans = [ 1, 2, 3, 4, 5, 6 ];
		model.beans.splice(3, 2, 'a', 'b', 'c');

		expect(model.beans.length).to.equal(7);
		expect(model.beans[0]).to.equal(1);
		expect(model.beans[1]).to.equal(2);
		expect(model.beans[2]).to.equal(3);
		expect(model.beans[3]).to.equal('a');
		expect(model.beans[4]).to.equal('b');
		expect(model.beans[5]).to.equal('c');
		expect(model.beans[6]).to.equal(6);

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(1);

				expect(spy.args[0][0].new.length).to.equal(7);
				expect(spy.args[0][0].new[0]).to.equal(1);
				expect(spy.args[0][0].new[1]).to.equal(2);
				expect(spy.args[0][0].new[2]).to.equal(3);
				expect(spy.args[0][0].new[3]).to.equal('a');
				expect(spy.args[0][0].new[4]).to.equal('b');
				expect(spy.args[0][0].new[5]).to.equal('c');
				expect(spy.args[0][0].new[6]).to.equal(6);

				done();
			} catch (e) {
				done(e);
			}
		}, 11);
	});

	it('should ignore concatination', function(done) {
		var model = new Model({
				beans: []
			}),
			spy = sinon.spy(),
			yolo;

		model.on_update('beans', spy);

		yolo = model.beans.concat([ 1, 2, 3 ]);

		expect(model.beans.length).to.equal(0);
		expect(yolo.length).to.equal(3);
		expect(yolo[0]).to.equal(1);
		expect(yolo[1]).to.equal(2);
		expect(yolo[2]).to.equal(3);

		setTimeout(function() {
			try {
				expect(spy.callCount).to.equal(0);

				done();
			} catch (e) {
				done(e);
			}
		}, 11);
	});

	it('should fill basic arrays', function() {
		var model = new Model({
			beans: []
		});

		model.fill({ beans: [ 1, 2, 3 ] });

		expect(model.beans.length).to.equal(3);
		expect(model.beans[0]).to.equal(1);
		expect(model.beans[1]).to.equal(2);
		expect(model.beans[2]).to.equal(3);
	});

	it('should clear basic arrays', function() {
		var model = new Model({
			beans: []
		});

		model.fill({ beans: [ 1, 2, 3 ] });

		model.clear();

		expect(model.beans.length).to.equal(0);
	});

	it('should serialize basic arrays', function() {
		var model = new Model({
				beans: []
			}),
			out;

		model.fill({ beans: [ 1, 2, 3 ] });
		out = model.out();

		expect(out.beans.length).to.equal(3);
		expect(out.beans[0]).to.equal(1);
		expect(out.beans[1]).to.equal(2);
		expect(out.beans[2]).to.equal(3);
	});
});

describe('The magic model hierarchy', function() {
	it('should construct sub models defined as properties', function() {
		var model = new Model({
			id: 47,
			sub: SubModel
		});

		model.sub = {
			id: 34,
			name: 'hashtag',
			yolo: 'factor'
		};

		expect(model.sub instanceof SubModel).to.be.true;
		expect(model.sub.id).to.equal(34);
		expect(model.sub.name).to.equal('hashtag');
	});

	it('should fill sub models defined as properties', function() {
		var model = new Model({
			id: 47,
			sub: SubModel
		});

		model.fill({
			id: 90,
			sub: {
				id: 34,
				name: 'hashtag',
				yolo: 'factor'
			}
		});

		expect(model.sub instanceof SubModel).to.be.true;
		expect(model.id).to.equal(90);
		expect(model.sub.id).to.equal(34);
		expect(model.sub.name).to.equal('hashtag');
	});

	it('should serialize sub models defined as properties', function() {
		var model = new Model({
				id: 47,
				sub: SubModel
			}),
			out;

		model.fill({
			id: 90,
			sub: {
				id: 34,
				name: 'hashtag',
				yolo: 'factor'
			}
		});

		out = model.out();

		expect(out.sub instanceof SubModel).to.be.false;
		expect(out.id).to.equal(90);
		expect(out.sub.id).to.equal(34);
		expect(out.sub.name).to.equal('hashtag');
	});

	it('should serialize sub models assigned as properties', function() {
		var model = new Model({
				id: 47,
				sub: null
			}),
			out;

		model.sub = new SubModel({
			id: 34,
			name: 'hashtag',
			yolo: 'factor'
		});

		out = model.out();

		expect(out.sub instanceof SubModel).to.be.false;
		expect(out.sub.id).to.equal(34);
		expect(out.sub.name).to.equal('hashtag');
	});

	it('should construct sub models defined as array constructors', function() {
		var model = new Model({
			id: 47,
			sub: [ SubModel ]
		});

		model.sub = [
			{
				id: 34,
				name: 'hashtag',
				yolo: 'factor'
			},
			new SubModel({
				id: 41,
				name: 'the rock'
			})
		];

		expect(model.sub[0] instanceof SubModel).to.be.true;
		expect(model.sub[1] instanceof SubModel).to.be.true;

		expect(model.sub[0].id).to.equal(34);
		expect(model.sub[0].name).to.equal('hashtag');
		expect(model.sub[1].id).to.equal(41);
		expect(model.sub[1].name).to.equal('the rock');
	});

	it('should fill sub models defined as array constructors', function() {
		var model = new Model({
			id: 47,
			sub: [ SubModel ]
		});

		model.fill({
			id: 90,
			sub: [
				{
					id: 34,
					name: 'hashtag',
					yolo: 'factor'
				}, {
					id: 41,
					name: 'the rock'
				}
			]
		});

		expect(model.sub.length).to.equal(2);
		expect(model.sub[0] instanceof SubModel).to.be.true;
		expect(model.sub[1] instanceof SubModel).to.be.true;

		expect(model.id).to.equal(90);
		expect(model.sub[0].id).to.equal(34);
		expect(model.sub[0].name).to.equal('hashtag');
		expect(model.sub[1].id).to.equal(41);
		expect(model.sub[1].name).to.equal('the rock');
	});

	it('should clear sub models defined as array constructors', function() {
		var model = new Model({
			id: 47,
			sub: [ SubModel ]
		});

		model.fill({
			id: 90,
			sub: [
				{
					id: 34,
					name: 'hashtag',
					yolo: 'factor'
				}, {
					id: 41,
					name: 'the rock'
				}
			]
		});

		model.clear();

		expect(model.id).to.equal(47);
		expect(model.sub.length).to.equal(0);
	});

	it('should serialize sub models defined as array constructors', function() {
		var model = new Model({
				id: 47,
				sub: [ SubModel ]
			}),
			out;

		model.fill({
			id: 90,
			sub: [
				{
					id: 34,
					name: 'hashtag',
					yolo: 'factor'
				}, {
					id: 41,
					name: 'the rock'
				}
			]
		});

		out = model.out();

		expect(out.sub.length).to.equal(2);
		expect(out.sub[0] instanceof SubModel).to.be.false;
		expect(out.sub[1] instanceof SubModel).to.be.false;

		expect(out.id).to.equal(90);
		expect(out.sub[0].id).to.equal(34);
		expect(out.sub[0].name).to.equal('hashtag');
		expect(out.sub[1].id).to.equal(41);
		expect(out.sub[1].name).to.equal('the rock');
	});

	it('should call model constructor on push', function() {
		var model = new Model({
				id: 47,
				sub: [ SubModel ]
			}),
			out;

		model.sub.push(new SubModel({ id: 34, name: 'hashtag' }));
		model.sub.push({ id: 41, name: 'the rock' });
		out = model.out();

		expect(model.sub.length).to.equal(2);
		expect(model.sub[0] instanceof SubModel).to.be.true;
		expect(model.sub[1] instanceof SubModel).to.be.true;

		expect(model.id).to.equal(47);
		expect(model.sub[0].id).to.equal(34);
		expect(model.sub[0].name).to.equal('hashtag');
		expect(model.sub[1].id).to.equal(41);
		expect(model.sub[1].name).to.equal('the rock');

		expect(out.sub.length).to.equal(2);
		expect(out.sub[0] instanceof SubModel).to.be.false;
		expect(out.sub[1] instanceof SubModel).to.be.false;
		expect(out.sub[0].id).to.equal(34);
		expect(out.sub[0].name).to.equal('hashtag');
		expect(out.sub[1].id).to.equal(41);
		expect(out.sub[1].name).to.equal('the rock');
	});

	it('should call model constructor on unshift', function() {
		var model = new Model({
			id: 47,
			sub: [ SubModel ]
		});

		model.sub.unshift({ id: 41, name: 'the rock' });
		model.sub.unshift(new SubModel({ id: 34, name: 'hashtag' }));

		expect(model.sub.length).to.equal(2);
		expect(model.sub[0] instanceof SubModel).to.be.true;
		expect(model.sub[1] instanceof SubModel).to.be.true;

		expect(model.id).to.equal(47);
		expect(model.sub[0].id).to.equal(34);
		expect(model.sub[0].name).to.equal('hashtag');
		expect(model.sub[1].id).to.equal(41);
		expect(model.sub[1].name).to.equal('the rock');
	});

	it('should call model constructor on splice', function() {
		var model = new Model({
			id: 47,
			sub: [ SubModel ]
		});

		model.fill({
			sub: [
				{
					id: 1,
					name: 'yolo1'
				}, {
					id: 2,
					name: 'yolo2'
				}, {
					id: 3,
					name: 'yolo3'
				}
			]
		});

		model.sub.splice(
			1,
			1,
			new SubModel({ id: 34, name: 'hashtag' }),
			{ id: 41, name: 'the rock' }
		);

		expect(model.sub.length).to.equal(4);
		expect(model.sub[0] instanceof SubModel).to.be.true;
		expect(model.sub[1] instanceof SubModel).to.be.true;
		expect(model.sub[2] instanceof SubModel).to.be.true;
		expect(model.sub[3] instanceof SubModel).to.be.true;
	});
});

describe('The magic model validation', function() {
	it('should not assign if deemed invalid', function() {
		var model = new Model({
			id: 12,
			hashtag: 'yolo'
		}).before({
			hashtag(val) {
				if (val !== 'selfie') {
					return [ true, val ];
				}

				return [ false, val ];
			}
		});

		model.hashtag = 'thuglife';
		expect(model.hashtag).to.equal('yolo');

		model.hashtag = 'selfie';
		expect(model.hashtag).to.equal('selfie');
	});

	it('should transform data', function() {
		var model = new Model({
			id: 12,
			hashtag: 'yolo'
		}).before({
			hashtag(val) {
				return [ false, val.toUpperCase() ];
			}
		});

		model.hashtag = 'thuglife';
		expect(model.hashtag).to.equal('THUGLIFE');
	});

	it('should be picky', function() {
		var model = new Model({
			id: 12,
			hashtag: 'yolo'
		});

		expect(function() {
			model.before({
				bean() {}
			});
		}).to.throw(
			'Model: called before on a property (bean) that does not exist');
	});

	it('should accept arrays', function() {
		var model = new Model({
			id: 12,
			hashtag: 'yolo'
		}).before({
			hashtag: [
				function(val) {
					return [ false, val.toUpperCase() ];
				},
				function(val) {
					return [ false, val.slice(0, 4) ];
				}
			]
		});

		model.hashtag = 'thuglife';
		expect(model.hashtag).to.equal('THUG');
	});
});
