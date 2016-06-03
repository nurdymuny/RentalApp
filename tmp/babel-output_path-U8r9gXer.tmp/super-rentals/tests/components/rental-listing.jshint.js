define('super-rentals/tests/components/rental-listing.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint | components/rental-listing.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(false, 'components/rental-listing.js should pass jshint.\ncomponents/rental-listing.js: line 1, col 16, \'Ember\' is not defined.\n\n1 error');
  });
});