import ReactComponent from 'react/lib/ReactComponent';
import ReactDOM from 'react-dom';
import { extend } from './util.js';
import Model from './model.js';

/**\

	ModelListener
		watches models for updates, when the update is passed through
		the param.model field. If a param named watchOnly is sent, the
		view will only update when those fields are updated in the model

		this is in es5 format until browsers start supporting new.target
		or the Reflect API to allow the constructor to access static
		properties on the sub class (this.constructor)

\**/

function list_em(model) {
	var keys = model.keys(),
		out = {},
		ni;

	for (ni = 0; ni < keys.length; ni++) {
		if (typeof model[keys[ni]] === 'function') {
			out[keys[ni]] = model[keys[ni]].bind(model);
		} else {
			out[keys[ni]] = model[keys[ni]];
		}
	}

	return out;
}

function ModelListener(props, context, updater) {
	var _props = extend(this.constructor.defaultProps || {}, props),
		ni, model, bind_watch;

	if (!(this instanceof ModelListener)) {
		throw new TypeError('Cannot call a class as a function');
	}

	if (!_props.hasOwnProperty('model')) {
		throw new Error('ModelListener requires a model');
	}

	if (!(_props.model instanceof Model)) {
		_props.model = new _props.model();
	}

	ReactComponent.call(this, _props, context, updater);

	this._when_ready = [];

	if (!this.props.hasOwnProperty('watchOnly')) {
		this.props.model.on_update('*', function () {
			this.setState(list_em(this.props.model));
		}.bind(this));
	} else {
		bind_watch = function(key) {
			this.props.model.on_update(key, function () {
				var obj = {};

				obj[key] = self.props.model[key];

				self.setState(obj);
			}.bind(this));
		}.bind(this);

		for (ni = 0; ni < this.props.watchOnly.length; ni++) {
			bind_watch(this.props.watchOnly[ni]);
		}
	}
}

ModelListener.prototype = Object.create(
	ReactComponent.prototype,
	{
		constructor: {
			value: ModelListener,
			enumerable: false,
			writable: true,
			configurable: true
		}
	}
);

ModelListener.prototype.componentWillMount = function() {
	if (!this.props.hasOwnProperty('model')) {
		return;
	}

	this.state = list_em(this.props.model);
};

ModelListener.prototype.componentDidMount = function() {
	var ni;

	this.node = ReactDOM.findDOMNode(this);

	this.setState(list_em(this.props.model));

	for (ni = 0; ni < this._when_ready.length; ni++) {
		this._when_ready[ni](this.node);
	}

	this._when_ready = [];
};

ModelListener.prototype.componentWillUpdate = function(nextProps, nextState) {
	var keys = this.props.model.keys(),
		ni;

	for (ni = 0; ni < keys.length; ni++) {
		if (typeof this.props.model[keys[ni]] === 'function') {
			continue;
		}

		this.props.model[keys[ni]] = nextState[keys[ni]];
	}
};

ModelListener.prototype.componentWillUnmount = function() {
	this.node = null;
};

ModelListener.prototype.when_ready = function(cb) {
	if (typeof cb !== 'function') {
		return;
	}

	if (this.node) {
		cb(this.node);
		return;
	}

	this._when_ready.push(cb);
};

ModelListener.prototype.update = function(field, value) {
	var _state = {};

	_state[field] = value;
	this.setState(_state);
};

if (Object.setPrototypeOf) {
	Object.setPrototypeOf(ModelListener, ReactComponent);
} else {
	ModelListener.__proto__ = ReactComponent;
}

export default ModelListener;
