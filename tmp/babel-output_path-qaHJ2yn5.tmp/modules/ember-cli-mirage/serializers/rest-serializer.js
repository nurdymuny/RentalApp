import ActiveModelSerializer from './active-model-serializer';
import { camelize, pluralize } from '../utils/inflector';

export default ActiveModelSerializer.extend({

  keyForModel: function keyForModel(type) {
    return camelize(type);
  },

  keyForAttribute: function keyForAttribute(attr) {
    return camelize(attr);
  },

  keyForRelationship: function keyForRelationship(type) {
    return pluralize(camelize(type));
  },

  keyForRelationshipIds: function keyForRelationshipIds(type) {
    return camelize(type) + 'Ids';
  }
});