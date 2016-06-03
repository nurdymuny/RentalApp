define('ember-cli-mirage/factory', ['exports', 'lodash/object/keys', 'lodash/object/assign', 'lodash/lang/isArray', 'lodash/lang/isFunction', 'lodash/object/mapValues', 'ember-cli-mirage/utils/reference-sort', 'lodash/lang/isPlainObject'], function (exports, _lodashObjectKeys, _lodashObjectAssign, _lodashLangIsArray, _lodashLangIsFunction, _lodashObjectMapValues, _emberCliMirageUtilsReferenceSort, _lodashLangIsPlainObject) {
  'use strict';

  var Factory = function Factory() {
    this.build = function (sequence) {
      var object = {};
      var topLevelAttrs = this.attrs || {};
      var keys = sortAttrs(topLevelAttrs, sequence);

      keys.forEach(function (key) {

        var buildAttrs = undefined;
        var buildSingleValue = undefined;

        buildAttrs = function (attrs) {
          return (0, _lodashObjectMapValues['default'])(attrs, buildSingleValue);
        };

        buildSingleValue = function (value) {
          if ((0, _lodashLangIsArray['default'])(value)) {
            return value.map(buildSingleValue);
          } else if ((0, _lodashLangIsPlainObject['default'])(value)) {
            return buildAttrs(value);
          } else if ((0, _lodashLangIsFunction['default'])(value)) {
            return value.call(topLevelAttrs, sequence);
          } else {
            return value;
          }
        };

        var value = topLevelAttrs[key];
        if ((0, _lodashLangIsFunction['default'])(value)) {
          object[key] = value.call(object, sequence);
        } else {
          object[key] = buildSingleValue(value);
        }
      });

      return object;
    };
  };

  Factory.extend = function (attrs) {
    // Merge the new attributes with existing ones. If conflict, new ones win.
    var newAttrs = (0, _lodashObjectAssign['default'])({}, this.attrs, attrs);

    var Subclass = function Subclass() {
      this.attrs = newAttrs;
      Factory.call(this);
    };

    // Copy extend
    Subclass.extend = Factory.extend;

    // Store a reference on the class for future subclasses
    Subclass.attrs = newAttrs;

    return Subclass;
  };

  function sortAttrs(attrs, sequence) {
    var Temp = function Temp() {};
    var obj = new Temp();
    var refs = [];
    var property = undefined;

    (0, _lodashObjectKeys['default'])(attrs).forEach(function (key) {
      Object.defineProperty(obj.constructor.prototype, key, {
        get: function get() {
          refs.push([property, key]);
        },
        enumerable: false,
        configurable: true
      });
    });

    (0, _lodashObjectKeys['default'])(attrs).forEach(function (key) {
      var value = attrs[key];
      property = key;

      if (typeof value === 'function') {
        value.call(obj, sequence);
      }

      refs.push([key]);
    });

    return (0, _emberCliMirageUtilsReferenceSort['default'])(refs);
  }

  exports['default'] = Factory;
});