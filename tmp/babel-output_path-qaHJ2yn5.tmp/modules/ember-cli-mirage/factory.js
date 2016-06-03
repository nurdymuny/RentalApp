import _keys from 'lodash/object/keys';
import _assign from 'lodash/object/assign';
import _isArray from 'lodash/lang/isArray';
import _isFunction from 'lodash/lang/isFunction';
import _mapValues from 'lodash/object/mapValues';
import referenceSort from './utils/reference-sort';
import _isPlainObject from 'lodash/lang/isPlainObject';

var Factory = function Factory() {
  this.build = function (sequence) {
    var object = {};
    var topLevelAttrs = this.attrs || {};
    var keys = sortAttrs(topLevelAttrs, sequence);

    keys.forEach(function (key) {

      var buildAttrs = undefined;
      var buildSingleValue = undefined;

      buildAttrs = function (attrs) {
        return _mapValues(attrs, buildSingleValue);
      };

      buildSingleValue = function (value) {
        if (_isArray(value)) {
          return value.map(buildSingleValue);
        } else if (_isPlainObject(value)) {
          return buildAttrs(value);
        } else if (_isFunction(value)) {
          return value.call(topLevelAttrs, sequence);
        } else {
          return value;
        }
      };

      var value = topLevelAttrs[key];
      if (_isFunction(value)) {
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
  var newAttrs = _assign({}, this.attrs, attrs);

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

  _keys(attrs).forEach(function (key) {
    Object.defineProperty(obj.constructor.prototype, key, {
      get: function get() {
        refs.push([property, key]);
      },
      enumerable: false,
      configurable: true
    });
  });

  _keys(attrs).forEach(function (key) {
    var value = attrs[key];
    property = key;

    if (typeof value === 'function') {
      value.call(obj, sequence);
    }

    refs.push([key]);
  });

  return referenceSort(refs);
}

export default Factory;