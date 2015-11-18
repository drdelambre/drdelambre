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

class ModelListener extends React.Component {
	model = null
	_when_ready = []

	constructor(props) {
		let bind_watch,
			ni;

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
			this.model.on_update('*', function() {
				if (typeof window !== 'undefined') {
					this.forceUpdate();
				}
			}.bind(this));
		} else {
			bind_watch = function(key) {
				this.model.on_update(key, function() {
					if (typeof window !== 'undefined') {
						this.forceUpdate();
					}
				}.bind(this));
			}.bind(this);

			for (ni = 0; ni < this.props.watchOnly.length; ni++) {
				bind_watch(this.props.watchOnly[ni]);
			}
		}
	}

	componentWillReceiveProps(props) {
		if (props.hasOwnProperty('model')) {
			if (props.model instanceof Model) {
				this.model = props.model;
			} else {
				this.model = new props.model();
			}
		}
	}

	componentDidMount() {
		let ni;

		this.node = ReactDOM.findDOMNode(this);

		for (ni = 0; ni < this._when_ready.length; ni++) {
			this._when_ready[ni](this.node);
		}

		this._when_ready = [];
	}

	componentDidUpdate() {
		let ni;

		for (ni = 0; ni < this._when_ready.length; ni++) {
			this._when_ready[ni](this.node);
		}

		this._when_ready = [];
	}

	componentWillUnmount() {
		this.node = null;
	}

	render_queue(cb) {
		if (typeof cb !== 'function') {
			return;
		}

		if (this.node) {
			cb(this.node);
			return;
		}

		this._when_ready.push(cb);
	}

	update(field, value) {
		const _state = {};

		_state[field] = value;

		this.model.fill(_state);
	}
}

export default ModelListener;
