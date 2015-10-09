import { init, extend, type } from './util.js';
import dom from './dom.js';
import Model from './model.js';

function initialize_render(obj, param) {
	obj.on_update(param, function() {
		init(function() {
			var ni;

			if (!obj.element) {
				return;
			}

			for (ni = 0; ni < obj._def[param].view.length; ni++) {
				obj._def[param].view[ni]();
			}
		});
	});
}

class View extends Model {
	constructor(def) {
		var template;

		super();

		if (def.hasOwnProperty('template')) {
			template = def.template;
			delete def.template;
		}

		this.extend(extend({
			element: null
		}, def));

		if (template) {
			init(function() {
				var elem = dom(template);

				if (!elem._len) {
					throw new Error(
						'View: template (' + template + ') does not exist');
				}

				elem = dom(elem.html().trim());

				if (elem._len > 1) {
					throw new Error(
						'View: template (' + template +
						') is more than one element');
				}

				this.element = elem;
			}.bind(this));
		}
	}

	extend(def) {
		// filter out array type things cause they're special

		super.extend(def);

		return this;
	}

	render(def) {
		var ni, no;

		for (ni in def) {
			if (!this._def.hasOwnProperty(ni)) {
				throw new Error(
					'View: called render on a property (' +
					ni + ') that does not exist');
			}

			/* istanbul ignore else: else implies no action */
			if (!this._def[ni].view) {
				this._def[ni].view = [];

				initialize_render(this, ni);
			}

			/* istanbul ignore else: else implies no action */
			if (!type(def[ni], 'array')) {
				def[ni] = [ def[ni] ];
			}

			this._def[ni].view = this._def[ni].view.concat(def[ni]);

			/* istanbul ignore else: else implies no action */
			if (this.element) {
				for (no = 0; no < this._def[ni].view.length; no++) {
					this._def[ni].view[no]();
				}
			}
		}

		return this;
	}
}

export default View;
