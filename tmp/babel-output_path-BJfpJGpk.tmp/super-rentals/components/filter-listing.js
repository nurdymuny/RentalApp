define('super-rentals/components/filter-listing', ['exports'], function (exports) {
  exports['default'] = Ember.Component.extend({
    filter: null,
    filteredList: null,
    actions: {
      autoComplete: function autoComplete() {
        this.get('autoComplete')(this.get('filter'));
      },
      search: function search() {
        this.get('search')(this.get('filter'));
      },
      choose: function choose(city) {
        this.set('filter', city);
      }
    }
  });
});