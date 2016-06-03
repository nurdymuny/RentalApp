define('ember-cli-mirage/server', ['exports', 'ember-cli-mirage/utils/inflector', 'pretender', 'ember-cli-mirage/db', 'ember-cli-mirage/orm/schema', 'ember-cli-mirage/assert', 'ember-cli-mirage/serializer-registry', 'ember-cli-mirage/route-handler', 'lodash/lang/isArray', 'lodash/object/keys', 'lodash/object/pick', 'lodash/object/assign'], function (exports, _emberCliMirageUtilsInflector, _pretender, _emberCliMirageDb, _emberCliMirageOrmSchema, _emberCliMirageAssert, _emberCliMirageSerializerRegistry, _emberCliMirageRouteHandler, _lodashLangIsArray, _lodashObjectKeys, _lodashObjectPick, _lodashObjectAssign) {
  'use strict';

  var _slicedToArray = (function () {
    function sliceIterator(arr, i) {
      var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;_e = err;
      } finally {
        try {
          if (!_n && _i['return']) _i['return']();
        } finally {
          if (_d) throw _e;
        }
      }return _arr;
    }return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError('Invalid attempt to destructure non-iterable instance');
      }
    };
  })();

  var _createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  })();

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;
    } else {
      return Array.from(arr);
    }
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function');
    }
  }

  // jscs:disable requireParenthesesAroundArrowParam

  function createPretender(server) {
    return new _pretender['default'](function () {
      this.passthroughRequest = function (verb, path, request) {
        if (server.shouldLog()) {
          console.log('Passthrough request: ' + verb.toUpperCase() + ' ' + request.url);
        }
      };

      this.handledRequest = function (verb, path, request) {
        if (server.shouldLog()) {
          console.log('Successful request: ' + verb.toUpperCase() + ' ' + request.url);
          var responseText = request.responseText;

          var loggedResponse = undefined;

          try {
            loggedResponse = JSON.parse(responseText);
          } catch (e) {
            loggedResponse = responseText;
          }

          console.log(loggedResponse);
        }
      };

      this.unhandledRequest = function (verb, path) {
        path = decodeURI(path);
        (0, _emberCliMirageAssert['default'])('Your Ember app tried to ' + verb + ' \'' + path + '\',\n         but there was no route defined to handle this request.\n         Define a route that matches this path in your\n         mirage/config.js file. Did you forget to add your namespace?');
      };
    });
  }

  var defaultRouteOptions = {
    coalesce: false,
    timing: undefined
  };

  var defaultPassthroughs = ['http://localhost:0/chromecheckurl'];
  exports.defaultPassthroughs = defaultPassthroughs;

  function isOption(option) {
    if (!option || typeof option !== 'object') {
      return false;
    }

    var allOptions = Object.keys(defaultRouteOptions);
    var optionKeys = Object.keys(option);
    for (var i = 0; i < optionKeys.length; i++) {
      var key = optionKeys[i];
      if (allOptions.indexOf(key) > -1) {
        return true;
      }
    }
    return false;
  }

  /*
    Args can be of the form
      [options]
      [object, code]
      [function, code]
      [shorthand, options]
      [shorthand, code, options]
      with all optional. This method returns an array of
      [handler (i.e. the function, object or shorthand), code, options].
  */

  function extractRouteArguments(args) {
    var _args$splice = args.splice(-1);

    var _args$splice2 = _slicedToArray(_args$splice, 1);

    var lastArg = _args$splice2[0];

    if (isOption(lastArg)) {
      lastArg = (0, _lodashObjectAssign['default'])({}, defaultRouteOptions, lastArg);
    } else {
      args.push(lastArg);
      lastArg = defaultRouteOptions;
    }
    var t = 2 - args.length;
    while (t-- > 0) {
      args.push(undefined);
    }
    args.push(lastArg);
    return args;
  }

  var Server = (function () {
    function Server() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, Server);

      this.environment = options.environment || 'development';
      this.options = options;
      this.timing = 400;
      this.namespace = '';
      this.urlPrefix = '';

      this._defineRouteHandlerHelpers();

      this.db = new _emberCliMirageDb['default']();
      this.schema = new _emberCliMirageOrmSchema['default'](this.db, options.models);
      this.serializerOrRegistry = new _emberCliMirageSerializerRegistry['default'](this.schema, options.serializers);

      var hasFactories = this._hasModulesOfType(options, 'factories');
      var hasDefaultScenario = options.scenarios && options.scenarios.hasOwnProperty('default');

      this.pretender = createPretender(this);

      if (options.baseConfig) {
        this.loadConfig(options.baseConfig);
      }

      if (this.isTest()) {
        if (options.testConfig) {
          this.loadConfig(options.testConfig);
        }

        window.server = this; // TODO: Better way to inject server into test env
      }

      if (this.isTest() && hasFactories) {
        this.loadFactories(options.factories);
      } else if (!this.isTest() && hasDefaultScenario) {
        this.loadFactories(options.factories);
        options.scenarios['default'](this);
      } else {
        this.loadFixtures();
      }

      if (options.useDefaultPassthroughs) {
        this._configureDefaultPassthroughs();
      }
    }

    _createClass(Server, [{
      key: 'isTest',
      value: function isTest() {
        return this.environment === 'test';
      }
    }, {
      key: 'shouldLog',
      value: function shouldLog() {
        return typeof this.logging !== 'undefined' ? this.logging : !this.isTest();
      }
    }, {
      key: 'loadConfig',
      value: function loadConfig(config) {
        config.call(this);
        this.timing = this.isTest() ? 0 : this.timing || 0;
      }
    }, {
      key: 'passthrough',
      value: function passthrough() {
        var _this = this;

        for (var _len = arguments.length, paths = Array(_len), _key = 0; _key < _len; _key++) {
          paths[_key] = arguments[_key];
        }

        var verbs = ['get', 'post', 'put', 'delete', 'patch'];
        var lastArg = paths[paths.length - 1];

        if (paths.length === 0) {
          // paths = ['http://localhost:7357'];
          paths = ['/**', '/'];
        } else if ((0, _lodashLangIsArray['default'])(lastArg)) {
          verbs = paths.pop();
        }

        verbs.forEach(function (verb) {
          paths.forEach(function (path) {
            var fullPath = _this._getFullPath(path);
            _this.pretender[verb](fullPath, _this.pretender.passthrough);
          });
        });
      }
    }, {
      key: 'loadFixtures',
      value: function loadFixtures() {
        var fixtures = this.options.fixtures;

        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        if (args.length) {
          var camelizedArgs = args.map(_emberCliMirageUtilsInflector.camelize);
          fixtures = _lodashObjectPick['default'].apply(undefined, [fixtures].concat(_toConsumableArray(camelizedArgs)));
        }

        this.db.loadData(fixtures);
      }

      /*
        Factory methods
      */
    }, {
      key: 'loadFactories',
      value: function loadFactories(factoryMap) {
        var _this2 = this;

        // Store a reference to the factories
        this._factoryMap = factoryMap;

        // Create a collection for each factory
        (0, _lodashObjectKeys['default'])(factoryMap).forEach(function (type) {
          var collectionName = _this2.schema ? (0, _emberCliMirageUtilsInflector.pluralize)((0, _emberCliMirageUtilsInflector.camelize)(type)) : (0, _emberCliMirageUtilsInflector.pluralize)(type);
          _this2.db.createCollection(collectionName);
        });
      }
    }, {
      key: 'build',
      value: function build(type, overrides) {
        var camelizedType = (0, _emberCliMirageUtilsInflector.camelize)(type);

        // Store sequence for factory type as instance variable
        this.factorySequences = this.factorySequences || {};
        this.factorySequences[camelizedType] = this.factorySequences[camelizedType] + 1 || 0;

        if (this._factoryMap && this._factoryMap[camelizedType]) {
          var OriginalFactory = this._factoryMap[camelizedType];
          var Factory = OriginalFactory.extend(overrides);
          var factory = new Factory();

          var sequence = this.factorySequences[camelizedType];
          return factory.build(sequence);
        } else {
          return overrides;
        }
      }
    }, {
      key: 'buildList',
      value: function buildList(type, amount, overrides) {
        var list = [];

        for (var i = 0; i < amount; i++) {
          list.push(this.build(type, overrides));
        }

        return list;
      }

      // When there is a Model defined, we should return an instance
      // of it instead of returning the bare attributes.
    }, {
      key: 'create',
      value: function create(type, overrides, collectionFromCreateList) {
        var attrs = this.build(type, overrides);
        var modelOrRecord = undefined;

        if (this.schema && this.schema[(0, _emberCliMirageUtilsInflector.pluralize)((0, _emberCliMirageUtilsInflector.camelize)(type))]) {
          var modelClass = this.schema[(0, _emberCliMirageUtilsInflector.pluralize)((0, _emberCliMirageUtilsInflector.camelize)(type))];

          modelOrRecord = modelClass.create(attrs);
        } else {
          var collection = undefined,
              collectionName = undefined;

          if (collectionFromCreateList) {
            collection = collectionFromCreateList;
          } else {
            collectionName = this.schema ? (0, _emberCliMirageUtilsInflector.pluralize)((0, _emberCliMirageUtilsInflector.camelize)(type)) : (0, _emberCliMirageUtilsInflector.pluralize)(type);
            collection = this.db[collectionName];
          }

          (0, _emberCliMirageAssert['default'])(collection, 'You called server.create(' + type + ') but no model or factory was found. Try `ember g mirage-model ' + type + '`.');
          modelOrRecord = collection.insert(attrs);
        }

        return modelOrRecord;
      }
    }, {
      key: 'createList',
      value: function createList(type, amount, overrides) {
        var list = [];
        var collectionName = this.schema ? (0, _emberCliMirageUtilsInflector.pluralize)((0, _emberCliMirageUtilsInflector.camelize)(type)) : (0, _emberCliMirageUtilsInflector.pluralize)(type);
        var collection = this.db[collectionName];

        for (var i = 0; i < amount; i++) {
          list.push(this.create(type, overrides, collection));
        }

        return list;
      }
    }, {
      key: 'shutdown',
      value: function shutdown() {
        this.pretender.shutdown();
        if (this.environment === 'test') {
          window.server = undefined;
        }
      }
    }, {
      key: '_defineRouteHandlerHelpers',
      value: function _defineRouteHandlerHelpers() {
        var _this3 = this;

        [['get'], ['post'], ['put'], ['delete', 'del'], ['patch'], ['head']].forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2);

          var verb = _ref2[0];
          var alias = _ref2[1];

          _this3[verb] = function (path) {
            for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
              args[_key3 - 1] = arguments[_key3];
            }

            var _extractRouteArguments = extractRouteArguments(args);

            var _extractRouteArguments2 = _slicedToArray(_extractRouteArguments, 3);

            var rawHandler = _extractRouteArguments2[0];
            var customizedCode = _extractRouteArguments2[1];
            var options = _extractRouteArguments2[2];

            _this3._registerRouteHandler(verb, path, rawHandler, customizedCode, options);
          };

          if (alias) {
            _this3[alias] = _this3[verb];
          }
        });
      }
    }, {
      key: '_serialize',
      value: function _serialize(body) {
        if (body) {
          return typeof body !== 'string' ? JSON.stringify(body) : body;
        } else {
          return '{"error": "not found"}';
        }
      }
    }, {
      key: '_registerRouteHandler',
      value: function _registerRouteHandler(verb, path, rawHandler, customizedCode, options) {
        var _this4 = this;

        var routeHandler = new _emberCliMirageRouteHandler['default']({
          schema: this.schema,
          verb: verb, rawHandler: rawHandler, customizedCode: customizedCode, options: options, path: path,
          serializerOrRegistry: this.serializerOrRegistry
        });

        var fullPath = this._getFullPath(path);
        var timing = options.timing !== undefined ? options.timing : function () {
          return _this4.timing;
        };

        this.pretender[verb](fullPath, function (request) {
          var _routeHandler$handle = routeHandler.handle(request);

          var _routeHandler$handle2 = _slicedToArray(_routeHandler$handle, 3);

          var code = _routeHandler$handle2[0];
          var headers = _routeHandler$handle2[1];
          var response = _routeHandler$handle2[2];

          return [code, headers, _this4._serialize(response)];
        }, timing);
      }
    }, {
      key: '_hasModulesOfType',
      value: function _hasModulesOfType(modules, type) {
        var modulesOfType = modules[type];
        return modulesOfType ? (0, _lodashObjectKeys['default'])(modulesOfType).length > 0 : false;
      }

      /*
        Builds a full path for Pretender to monitor based on the `path` and
        configured options (`urlPrefix` and `namespace`).
      */
    }, {
      key: '_getFullPath',
      value: function _getFullPath(path) {
        path = path[0] === '/' ? path.slice(1) : path;
        var fullPath = '';
        var urlPrefix = this.urlPrefix ? this.urlPrefix.trim() : '';
        var namespace = this.namespace ? this.namespace.trim() : '';

        // check to see if path is a FQDN. if so, ignore any urlPrefix/namespace that was set
        if (/^https?:\/\//.test(path)) {
          fullPath += path;
        } else {

          // otherwise, if there is a urlPrefix, use that as the beginning of the path
          if (!!urlPrefix.length) {
            fullPath += urlPrefix[urlPrefix.length - 1] === '/' ? urlPrefix : urlPrefix + '/';
          }

          // if a namespace has been configured, add it before the path
          if (!!namespace.length) {
            fullPath += namespace ? namespace + '/' : namespace;
          }

          // we're at the root, ensure a leading /
          if (!urlPrefix.length && !namespace.length) {
            fullPath += '/';
          }

          // finally add the configured path
          fullPath += path;
        }

        return fullPath;
      }
    }, {
      key: '_configureDefaultPassthroughs',
      value: function _configureDefaultPassthroughs() {
        var _this5 = this;

        defaultPassthroughs.forEach(function (passthroughUrl) {
          _this5.passthrough(passthroughUrl);
        });
      }
    }]);

    return Server;
  })();

  exports['default'] = Server;
});