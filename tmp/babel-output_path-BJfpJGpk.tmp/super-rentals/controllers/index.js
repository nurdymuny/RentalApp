define('super-rentals/controllers/index', ['exports', 'ember'], function (exports, _ember) {
	exports['default'] = _ember['default'].Controller.extend({
		filteredList: null,
		actions: {
			autoComplete: function autoComplete(param) {
				var _this = this;

				if (param !== '') {
					this.get('store').query('rental', { city: param }).then(function (result) {
						return _this.set('filteredList', result);
					});
				} else {
					this.set('filteredList', null);
				}
			},
			search: function search(param) {
				var _this2 = this;

				if (param !== '') {
					this.store.query('rental', { city: param }).then(function (result) {
						return _this2.set('model', result);
					});
				} else {
					this.get('store').findAll('rental').then(function (result) {
						return _this2.set('model', result);
					});
				}
			}
		}
	});
});