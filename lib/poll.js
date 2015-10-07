import { extend } from './util.js';
import ajax from './ajax.js';

/**\

	Poll

\**/
class Poll {
	constructor(freq) {
		this._current = null;
		this._next = null;

		this._freq = freq || 5000;
	}

	get_params() {}

	on_success() {}

	on_error() {}

	start() {
		var self = this;

		if (this._current) {
			return;
		}

		clearTimeout(this._next);
		this._next = null;

		this._current = ajax(extend(
			{
				method: 'GET',
				type: 'json'
			},
			this.get_params(),
			{
				success(data) {
					this._current = null;
					this._next = setTimeout(function() {
						self.start();
					}, this._freq);

					self.on_success(data);
				},
				error() {
					this._current = null;
					this._next = setTimeout(function() {
						self.start();
					}, this._freq);

					self.on_error();
				}
			}
		));
	}

	stop() {
		if (this._next) {
			clearTimeout(this._next);
			this._next = null;
		}

		if (this._current) {
			this._current.abort();
			this._current = null;
		}
	}
}

export default Poll;
