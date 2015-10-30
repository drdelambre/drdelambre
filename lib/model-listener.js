import React from 'react';
import ReactDOM from 'react-dom';
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

class ModelListener extends React.Component {
	model = null
	_when_ready = []

	constructor(props) {
		if (!props.hasOwnProperty('model')) {
			throw new Error('ModelListener requires a model');
		}

		super(props);

		if (!(props.model instanceof Model)) {
			this.model = new props.model();
		} else {
			this.model = props.model;
		}

		if (!this.props.hasOwnProperty('watchOnly')) {
			this.model.on_update('*', function () {
				this.setState(list_em(this.model));
			}.bind(this));
		} else {
			bind_watch = function(key) {
				this.model.on_update(key, function () {
					var obj = {};

					obj[key] = this.model[key];

					this.setState(obj);
				}.bind(this));
			}.bind(this);

			for (ni = 0; ni < this.props.watchOnly.length; ni++) {
				bind_watch(this.props.watchOnly[ni]);
			}
		}
	}

	componentWillMount() {
		this.state = list_em(this.model);
	};

	componentDidMount() {
		var ni;

		this.node = ReactDOM.findDOMNode(this);

		this.setState(list_em(this.model));

		for (ni = 0; ni < this._when_ready.length; ni++) {
			this._when_ready[ni](this.node);
		}

		this._when_ready = [];
	};

	componentWillUpdate(nextProps, nextState) {
		var keys = this.model.keys(),
			ni;

		for (ni = 0; ni < keys.length; ni++) {
			if (typeof this.model[keys[ni]] === 'function') {
				continue;
			}

			this.model[keys[ni]] = nextState[keys[ni]];
		}
	};

	componentWillUnmount() {
		this.node = null;
	};

	when_ready(cb) {
		if (typeof cb !== 'function') {
			return;
		}

		if (this.node) {
			cb(this.node);
			return;
		}

		this._when_ready.push(cb);
	};

	update(field, value) {
		var _state = {};

		_state[field] = value;
		this.setState(_state);
	};
}

export default ModelListener;
