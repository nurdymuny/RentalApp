var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

import Model from './orm/model';
import Collection from './orm/collection';
import _assign from 'lodash/object/assign';
import _compose from 'lodash/function/compose';
import extend from './utils/extend';
import { singularize, pluralize, camelize } from './utils/inflector';

import _isFunction from 'lodash/lang/isFunction';

var Serializer = (function () {
  function Serializer(registry, type) {
    var included = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
    var alreadySerialized = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

    _classCallCheck(this, Serializer);

    this.registry = registry;
    this.type = type;
    this.included = included;
    this.alreadySerialized = alreadySerialized;
  }

  // Defaults

  /**
   * Override this method to implement your own custom
   * serialize function. response is whatever was returned
   * from your route handler, and request is the Pretender
   * request object. Returns a plain JavaScript object or
   * array, which Mirage uses as the response data to your
   * Ember app’s XHR request. You can also override this method,
   * call super, and manipulate the data before Mirage responds
   * with it. This is a great place to add metadata, or for
   * one-off operations that don’t fit neatly into any of
   * Mirage’s other abstractions.
   * @method serialize
   * @param response
   * @param request
   * @public
   */

  _createClass(Serializer, [{
    key: 'serialize',
    value: function serialize(response) {
      var _this = this;

      var request = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (this.embed) {
        var json = undefined;

        if (this.isModel(response)) {
          json = this._serializeModel(response, request);
        } else {
          json = response.models.reduce(function (allAttrs, model) {
            allAttrs.push(_this._serializeModel(model));
            _this._resetAlreadySerialized();

            return allAttrs;
          }, []);
        }

        return this._formatResponse(response, json);
      } else {
        return this._serializeSideloadedModelOrCollection(response, request);
      }
    }
  }, {
    key: 'oldSerialize',
    value: function oldSerialize(response, request) {
      if (response instanceof Model) {
        return this._oldAttrsForModel(response);
      } else {
        return response;
      }
    }

    /**
     * Used to define a custom key when serializing a
     * primary model of modelName `modelName`.
     * @method keyForModel
     * @param modelName
     * @public
     */
  }, {
    key: 'keyForModel',
    value: function keyForModel(modelName) {
      return camelize(modelName);
    }

    /**
     * Used to customize the key when serializing a primary
     * collection. By default this pluralizes the return
     * value of `keyForModel`.
     * @method keyForCollection
     * @param modelName
     * @public
     */
  }, {
    key: 'keyForCollection',
    value: function keyForCollection(modelName) {
      return pluralize(this.keyForModel(modelName));
    }

    /**
     * Used to customize how a model’s attribute is
     * formatted in your JSON payload.
     * @method keyForAttribute
     * @param attr
     * @public
     */
  }, {
    key: 'keyForAttribute',
    value: function keyForAttribute(attr) {
      return attr;
    }

    /**
     * Use this hook to format the key for collections
     * related to this model.
     *
     * For example, if you're serializing an author that
     * side loads many `blogPosts`, you would get `blogPost`
     * as an argument, and whatever you return would
     * end up as the collection key in your JSON:
     *
     * keyForRelationship(type) {
     *   return dasherize(type);
     * }
     *
     * {
     *   author: {...},
     *   'blog-posts': [...]
     * }
     * @method keyForRelationship
     * @param modelName
     * @public
     */
  }, {
    key: 'keyForRelationship',
    value: function keyForRelationship(modelName) {
      return _compose(camelize, pluralize)(modelName);
    }

    /**
     * Use this hook to format the key for relationship ids
     * in this model's JSON representation.
     *
     * For example, if you're serializing an author that
     * side loads many `blogPosts`, you would get `blogPost`
     * as an argument, and whatever you return would
     * end up as part of the `author` JSON:
     *
     * keyForRelationshipIds(type) {
     *   return dasherize(type) + '-ids';
     * }
     *
     * {
     *   author: {
     *     ...,
     *     'blog-post-ids': [1, 2, 3]
     *   },
     *   'blog-posts': [...]
     * }
     * @method keyForRelationshipIds
     * @param modelName
     * @public
     */
  }, {
    key: 'keyForRelationshipIds',
    value: function keyForRelationshipIds(modelName) {
      return singularize(camelize(modelName)) + 'Ids';
    }

    /**
     * This method is used by the POST and PUT shorthands. These shorthands
     * expect a valid JSON:API document as part of the request, so that
     * they know how to create or update the appropriate resouce. The normalize
     * method allows you to transform your request body into a JSON:API
     * document, which lets you take advantage of the shorthands when you
     * otherwise may not be able to.
     *
     * Note that this method is a noop if you’re using JSON:API already,
     * since request payloads sent along with POST and PUT requests will
     * already be in the correct format.
     * @method normalize
     * @param json
     * @public
     */
  }, {
    key: 'normalize',
    value: function normalize(json) {
      return json;
    }

    /**
     * @method isModel
     * @param object
     * @return {Boolean}
     * @public
     */
  }, {
    key: 'isModel',
    value: function isModel(object) {
      return object instanceof Model;
    }

    /**
     * @method isCollection
     * @param object
     * @return {Boolean}
     * @public
     */
  }, {
    key: 'isCollection',
    value: function isCollection(object) {
      return object instanceof Collection;
    }

    /**
     * @method isModelOrCollection
     * @param object
     * @return {Boolean}
     * @public
     */
  }, {
    key: 'isModelOrCollection',
    value: function isModelOrCollection(object) {
      return this.isModel(object) || this.isCollection(object);
    }

    /**
     * @method serializerFor
     * @param type
     * @public
     */
  }, {
    key: 'serializerFor',
    value: function serializerFor(type) {
      return this.registry.serializerFor(type, {
        included: this.included,
        alreadySerialized: this.alreadySerialized
      });
    }

    /*
       Private methods
     */

    /**
     * @method _serializerModel
     * @param model
     * @param request
     * @param removeForeignKeys
     * @param serializeRelationships
     * @private
     */
  }, {
    key: '_serializeModel',
    value: function _serializeModel(model, request) {
      var removeForeignKeys = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
      var serializeRelationships = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];

      if (this._hasBeenSerialized(model)) {
        return;
      }

      var attrs = this._attrsForModel(model, request, removeForeignKeys);

      this._augmentAlreadySerialized(model);
      var relatedAttrs = serializeRelationships ? this._attrsForRelationships(model, request) : {};

      return _assign(attrs, relatedAttrs);
    }

    /**
     * @method _oldAttrsForModel
     * @param model
     * @private
     */
  }, {
    key: '_oldAttrsForModel',
    value: function _oldAttrsForModel(model) {
      var attrs = {};

      if (this.attrs) {
        attrs = this.attrs.reduce(function (memo, attr) {
          memo[attr] = model[attr];
          return memo;
        }, {});
      } else {
        attrs = _assign(attrs, model.attrs);
      }

      return this._formatAttributeKeys(attrs);
    }

    /**
     * @method _formatAttributeKeys
     * @param attrs
     * @private
     */
  }, {
    key: '_formatAttributeKeys',
    value: function _formatAttributeKeys(attrs) {

      var formattedAttrs = {};

      for (var key in attrs) {
        var formattedKey = this.keyForAttribute(key);
        formattedAttrs[formattedKey] = attrs[key];
      }

      return formattedAttrs;
    }

    /**
     * @method _resetAlreadySerialized
     * @private
     */
  }, {
    key: '_resetAlreadySerialized',
    value: function _resetAlreadySerialized() {
      this.alreadySerialized = {};
    }

    /**
     * @method _serializeSideloadedModelOrCollection
     * @param modelOrCollection
     * @param request
     * @private
     */
  }, {
    key: '_serializeSideloadedModelOrCollection',
    value: function _serializeSideloadedModelOrCollection(modelOrCollection, request) {
      var _this2 = this;

      if (this.isModel(modelOrCollection)) {
        return this._serializeSideloadedModelResponse(modelOrCollection, request);
      } else if (modelOrCollection.models && modelOrCollection.models.length) {

        return modelOrCollection.models.reduce(function (allAttrs, model) {
          return _this2._serializeSideloadedModelResponse(model, request, true, allAttrs);
        }, {});

        // We have an empty collection
      } else {
          return _defineProperty({}, this._keyForModelOrCollection(modelOrCollection), []);
        }
    }

    /**
     * @method _serializeSideloadedModelResponse
     * @param model
     * @param request
     * @param [topLevelIsArray=false]
     * @param allAttrs
     * @param [root=null]
     * @private
     */
  }, {
    key: '_serializeSideloadedModelResponse',
    value: function _serializeSideloadedModelResponse(model, request) {
      var topLevelIsArray = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      var _this3 = this;

      var allAttrs = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
      var root = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];

      if (this._hasBeenSerialized(model)) {
        return allAttrs;
      }

      // Add this model's attrs
      this._augmentAlreadySerialized(model);
      var modelAttrs = this._attrsForModel(model, request, false, true);
      var key = this._keyForModelOrCollection(model);

      if (topLevelIsArray) {
        key = root ? root : pluralize(key);
        allAttrs[key] = allAttrs[key] || [];
        allAttrs[key].push(modelAttrs);
      } else {
        allAttrs[key] = modelAttrs;
      }

      // Traverse this model's relationships
      this._valueForInclude(this, request).map(function (key) {
        return model[camelize(key)];
      }).filter(Boolean).forEach(function (relationship) {
        var relatedModels = _this3.isModel(relationship) ? [relationship] : relationship.models;

        relatedModels.forEach(function (relatedModel) {
          var serializer = _this3.serializerFor(relatedModel.modelName);
          serializer._serializeSideloadedModelResponse(relatedModel, request, true, allAttrs, serializer.keyForRelationship(relatedModel.modelName));
        });
      });

      return allAttrs;
    }

    /**
     * @method _formatResponse
     * @param modelOrCollection
     * @param attrs
     * @private
     */
  }, {
    key: '_formatResponse',
    value: function _formatResponse(modelOrCollection, attrs) {
      var serializer = this.serializerFor(modelOrCollection.modelName);
      var key = this._keyForModelOrCollection(modelOrCollection);

      return serializer.root ? _defineProperty({}, key, attrs) : attrs;
    }

    /**
     * @method _serializeModelOrCollection
     * @param modelOrCollection
     * @param request
     * @param removeForeignKeys
     * @param serializeRelationships
     * @private
     */
  }, {
    key: '_serializeModelOrCollection',
    value: function _serializeModelOrCollection(modelOrCollection, request, removeForeignKeys, serializeRelationships) {
      var _this4 = this;

      if (this.isModel(modelOrCollection)) {
        return this._serializeModel(modelOrCollection, request, removeForeignKeys, serializeRelationships);
      } else {
        return modelOrCollection.models.map(function (model) {
          return _this4._serializeModel(model, request, removeForeignKeys, serializeRelationships);
        });
      }
    }

    /**
     * @method _attrsForModel
     * @param model
     * @param request
     * @param removeForeignKeys
     * @param embedRelatedIds
     * @private
     */
  }, {
    key: '_attrsForModel',
    value: function _attrsForModel(model, request, removeForeignKeys, embedRelatedIds) {
      var _this5 = this;

      var attrs = this.oldSerialize(model, request);

      if (removeForeignKeys) {
        model.fks.forEach(function (key) {
          delete attrs[key];
        });
      }

      if (embedRelatedIds) {
        this._valueForInclude(this, request).map(function (key) {
          return model[camelize(key)];
        }).filter(this.isCollection).forEach(function (relatedCollection) {
          attrs[_this5.keyForRelationshipIds(relatedCollection.modelName)] = relatedCollection.models.map(function (model) {
            return model.id;
          });
        });
      }

      return attrs;
    }

    /**
     * @method _attrsForRelationships
     * @param model
     * @param request
     * @private
     */
  }, {
    key: '_attrsForRelationships',
    value: function _attrsForRelationships(model, request) {
      var _this6 = this;

      return this._valueForInclude(this, request).reduce(function (attrs, key) {
        var modelOrCollection = model[camelize(key)];
        var serializer = _this6.serializerFor(modelOrCollection.modelName);
        var relatedAttrs = serializer._serializeModelOrCollection(modelOrCollection, request);

        if (relatedAttrs) {
          attrs[camelize(key)] = relatedAttrs;
        }

        return attrs;
      }, {});
    }

    /**
     * @method _hasBeenSerialized
     * @param model
     * @private
     */
  }, {
    key: '_hasBeenSerialized',
    value: function _hasBeenSerialized(model) {
      var relationshipKey = camelize(model.modelName) + 'Ids';

      return this.alreadySerialized[relationshipKey] && this.alreadySerialized[relationshipKey].indexOf(model.id) > -1;
    }

    /**
     * @method _augmentAlreadySerialized
     * @param model
     * @private
     */
  }, {
    key: '_augmentAlreadySerialized',
    value: function _augmentAlreadySerialized(model) {
      var modelKey = camelize(model.modelName) + 'Ids';

      this.alreadySerialized[modelKey] = this.alreadySerialized[modelKey] || [];
      this.alreadySerialized[modelKey].push(model.id);
    }

    /**
     * @method _keyForModelOrCollection
     * @param modelOrCollection
     * @private
     */
  }, {
    key: '_keyForModelOrCollection',
    value: function _keyForModelOrCollection(modelOrCollection) {
      var serializer = this.serializerFor(modelOrCollection.modelName);

      if (this.isModel(modelOrCollection)) {
        return serializer.keyForModel(modelOrCollection.modelName);
      } else {
        return serializer.keyForCollection(modelOrCollection.modelName);
      }
    }

    /**
     * @method _valueForInclude
     * @param serializer
     * @param request
     * @private
     */
  }, {
    key: '_valueForInclude',
    value: function _valueForInclude(serializer, request) {
      var include = serializer.include;

      if (_isFunction(include)) {
        return include(request);
      } else {
        return include;
      }
    }
  }]);

  return Serializer;
})();

Serializer.prototype.include = [];
Serializer.prototype.root = true;
Serializer.prototype.embed = false;

Serializer.extend = extend;

export default Serializer;