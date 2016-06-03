define('ember-cli-mirage/serializers/json-api-serializer', ['exports', 'ember-cli-mirage/utils/extend', 'ember-cli-mirage/utils/inflector', 'ember-cli-mirage/orm/model', 'ember-cli-mirage/orm/collection', 'lodash/object/assign', 'lodash/array/flatten', 'lodash/object/get', 'lodash/string/trim', 'lodash/lang/isString', 'lodash'], function (exports, _emberCliMirageUtilsExtend, _emberCliMirageUtilsInflector, _emberCliMirageOrmModel, _emberCliMirageOrmCollection, _lodashObjectAssign, _lodashArrayFlatten, _lodashObjectGet, _lodashStringTrim, _lodashLangIsString, _lodash) {
  'use strict';

  var _createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  })();

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function');
    }
  }

  // jscs:disable requireParenthesesAroundArrowParam

  function isCollection(object) {
    return object instanceof _emberCliMirageOrmCollection['default'];
  }

  var JsonApiSerializer = (function () {
    function JsonApiSerializer(registry, type) {
      var included = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
      var alreadySerialized = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      _classCallCheck(this, JsonApiSerializer);

      this.registry = registry;
      this.type = type;
      this.included = included;
      this.alreadySerialized = alreadySerialized;
    }

    // Defaults

    _createClass(JsonApiSerializer, [{
      key: 'serialize',
      value: function serialize(modelOrCollection) {
        var request = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var response = undefined;

        if (modelOrCollection instanceof _emberCliMirageOrmModel['default']) {
          response = this._serializePrimaryModel(modelOrCollection, request);
        } else {
          response = this._serializePrimaryCollection(modelOrCollection, request);
        }

        if (this.included.length) {
          response.included = this.included;
        }

        return response;
      }
    }, {
      key: 'keyForAttribute',
      value: function keyForAttribute(attr) {
        return (0, _emberCliMirageUtilsInflector.dasherize)(attr);
      }
    }, {
      key: 'keyForRelationship',
      value: function keyForRelationship(key) {
        return (0, _emberCliMirageUtilsInflector.dasherize)(key);
      }
    }, {
      key: 'typeKeyForModel',
      value: function typeKeyForModel(model) {
        return (0, _emberCliMirageUtilsInflector.dasherize)((0, _emberCliMirageUtilsInflector.pluralize)(model.modelName));
      }
    }, {
      key: 'normalize',
      value: function normalize(json) {
        return json;
      }
    }, {
      key: 'toString',
      value: function toString() {
        return 'serializer:' + this.type;
      }
    }, {
      key: '_serializePrimaryModel',
      value: function _serializePrimaryModel(model, request) {
        this._augmentAlreadySerialized(model);

        var response = {
          data: this._resourceObjectFor(model, request)
        };

        this._serializeRelationshipsFor(model, request);

        return response;
      }
    }, {
      key: '_serializePrimaryCollection',
      value: function _serializePrimaryCollection(collection, request) {
        var _this = this;

        var response = {
          data: collection.models.map(function (model) {
            return _this._resourceObjectFor(model, request);
          })
        };

        collection.models.forEach(function (model) {
          _this._serializeRelationshipsFor(model, request);
        });

        return response;
      }
    }, {
      key: '_serializeRelationshipsFor',
      value: function _serializeRelationshipsFor(model, request) {
        var _this2 = this;

        var relationshipNames = this._getRelationshipNames(request);

        relationshipNames.forEach(function (relationshipName) {
          var association = _this2._getRelatedWithPath(model, relationshipName);

          if (association instanceof _emberCliMirageOrmModel['default']) {
            var serializer = _this2._serializerFor(association.modelName);
            serializer._serializeIncludedModel.call(serializer, association, request);
          } else if (association) {
            association.forEach(function (model) {
              var serializer = _this2._serializerFor(model.modelName);
              serializer._serializeIncludedModel.call(serializer, model, request);
            });
          }
        });
      }
    }, {
      key: '_serializeIncludedModel',
      value: function _serializeIncludedModel(model, request) {
        if (this._hasBeenSerialized(model)) {
          return;
        }
        this._augmentAlreadySerialized(model);

        this.included.push(this._resourceObjectFor(model, request));
        this._serializeRelationshipsFor(model, request);
      }
    }, {
      key: '_resourceObjectFor',
      value: function _resourceObjectFor(model /*, request */) {
        var _this3 = this;

        var attrs = this._attrsForModel(model);

        var obj = {
          type: this.typeKeyForModel(model),
          id: model.id,
          attributes: attrs
        };

        var linkData = this._linkDataFor(model);

        model.associationKeys.forEach(function (camelizedType) {
          var relationship = model[camelizedType];
          var relationshipKey = _this3.keyForRelationship(camelizedType);

          if (isCollection(relationship)) {
            if (!obj.relationships) {
              obj.relationships = {};
            }

            obj.relationships[relationshipKey] = {
              data: relationship.models.map(function (model) {
                return {
                  type: _this3.typeKeyForModel(model),
                  id: model.id
                };
              })
            };
          } else if (relationship) {
            if (!obj.relationships) {
              obj.relationships = {};
            }

            obj.relationships[relationshipKey] = {
              data: {
                type: _this3.typeKeyForModel(relationship),
                id: relationship.id
              }
            };
          }

          if (linkData && linkData[camelizedType]) {
            _this3._addLinkData(obj, relationshipKey, linkData[camelizedType]);
          }
        });

        return obj;
      }
    }, {
      key: '_linkDataFor',
      value: function _linkDataFor(model) {
        var serializer = this._serializerFor(model.modelName);
        var linkData = null;
        if (serializer && serializer.links) {
          linkData = serializer.links(model);
        }
        return linkData;
      }
    }, {
      key: '_addLinkData',
      value: function _addLinkData(json, relationshipKey, linkData) {
        if (!json.relationships[relationshipKey]) {
          json.relationships[relationshipKey] = {};
        }

        delete json.relationships[relationshipKey].data;
        json.relationships[relationshipKey].links = {};

        if (linkData.self) {
          json.relationships[relationshipKey].links.self = { href: linkData.self };
        }

        if (linkData.related) {
          json.relationships[relationshipKey].links.related = { href: linkData.related };
        }
      }
    }, {
      key: '_attrsForModel',
      value: function _attrsForModel(model) {
        var attrs = {};

        if (this.attrs) {
          attrs = this.attrs.reduce(function (memo, attr) {
            memo[attr] = model[attr];
            return memo;
          }, {});
        } else {
          attrs = (0, _lodashObjectAssign['default'])(attrs, model.attrs);
        }

        delete attrs.id;

        model.fks.forEach(function (fk) {
          delete attrs[fk];
        });

        return this._formatAttributeKeys(attrs);
      }
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
    }, {
      key: '_serializerFor',
      value: function _serializerFor(type) {

        return this.registry.serializerFor(type, {
          included: this.included,
          alreadySerialized: this.alreadySerialized
        });
      }
    }, {
      key: '_hasBeenSerialized',
      value: function _hasBeenSerialized(model) {
        var relationshipKey = model.modelName + 'Ids';
        var obj = this.alreadySerialized[relationshipKey];
        return obj && obj.indexOf(model.id) > -1;
      }
    }, {
      key: '_augmentAlreadySerialized',
      value: function _augmentAlreadySerialized(model) {
        var modelKey = model.modelName + 'Ids';

        this.alreadySerialized[modelKey] = this.alreadySerialized[modelKey] || [];
        this.alreadySerialized[modelKey].push(model.id);
      }
    }, {
      key: '_getRelationshipNames',
      value: function _getRelationshipNames() {
        var request = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var requestRelationships = (0, _lodashObjectGet['default'])(request, 'queryParams.include');
        var relationships = undefined;

        if ((0, _lodashLangIsString['default'])(requestRelationships)) {
          relationships = requestRelationships;
        } else {
          relationships = (0, _lodashObjectGet['default'])(this, 'include', []).join(',');
        }

        if (relationships.length) {
          var expandedRelationships = relationships.split(',').map(_lodashStringTrim['default']).map(function (r) {
            return r.split('.').map(function (_, index, elements) {
              return elements.slice(0, index + 1).join('.');
            });
          });

          return (0, _lodashArrayFlatten['default'])(expandedRelationships);
        }
        return [];
      }
    }, {
      key: '_getRelatedWithPath',
      value: function _getRelatedWithPath(parentModel, path) {
        return path.split('.').reduce(function (related, relationshipName) {
          return (0, _lodash['default'])(related).map(function (r) {
            return r.reload()[(0, _emberCliMirageUtilsInflector.camelize)(relationshipName)];
          }).map(function (r) {
            return isCollection(r) ? r.models : r;
          }) // Turning Collections into Arrays for lodash to recognize
          .flatten().filter().value();
        }, [parentModel]);
      }
    }]);

    return JsonApiSerializer;
  })();

  JsonApiSerializer.prototype.include = [];

  JsonApiSerializer.extend = _emberCliMirageUtilsExtend['default'];

  exports['default'] = JsonApiSerializer;
});