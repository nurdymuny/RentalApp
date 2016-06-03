define('super-rentals/models/rental', ['exports', 'ember-data/model', 'ember-data/attr'], function (exports, _emberDataModel, _emberDataAttr) {
  exports['default'] = _emberDataModel['default'].extend({
    title: (0, _emberDataAttr['default'])(),
    owner: (0, _emberDataAttr['default'])(),
    city: (0, _emberDataAttr['default'])(),
    type: (0, _emberDataAttr['default'])(),
    image: (0, _emberDataAttr['default'])(),
    bedrooms: (0, _emberDataAttr['default'])()
  });
});