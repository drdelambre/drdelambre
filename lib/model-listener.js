import React from 'react';

/**\

	ModelListener
		watches models for updates, when the update is passed through
		the param.model field. If a param named watchOnly is sent, the
		view will only update when those fields are updated in the model

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
	_when_ready = []

	constructor(props) {
		var self, ni;

		super(props);

		self = this;

		function bind_watch(key) {
			self.props.model.on_update(key, function() {
				var obj = {};

				obj[key] = self.props.model[key];

				self.setState(obj);
			});
		}

		if (!this.props.hasOwnProperty('model')) {
			return this;
		}

		if (!this.props.hasOwnProperty('watchOnly')) {
			this.props.model.on_update('*', function() {
				self.setState(list_em(self.props.model));
			});
		} else {
			for (ni = 0; ni < this.props.watchOnly.length; ni++) {
				bind_watch(this.props.watchOnly[ni]);
			}
		}

		return this;
	}

	componentWillMount() {
		if (!this.props.hasOwnProperty('model')) {
			return;
		}

		this.state = list_em(this.props.model);
	}

	componentDidMount() {
		var ni;

		this.node = React.findDOMNode(this);

		this.setState(list_em(this.props.model));

		for (ni = 0; ni < this._when_ready.length; ni++) {
			this._when_ready[ni](this.node);
		}

		this._when_ready = [];
	}

	componentDidUnmount() {
		this.node = null;
	}

	when_ready(cb) {
		if (typeof cb !== 'function') {
			return;
		}

		if (this.node) {
			cb(this.node);
			return;
		}

		this._when_ready.push(cb);
	}
}

export default ModelListener;
