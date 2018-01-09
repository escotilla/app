'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _redux = require('redux');

var _featuresByCollection = require('./featuresByCollection');

var _featuresByCollection2 = _interopRequireDefault(_featuresByCollection);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _payloadByPage = require('./payloadByPage');

var _payloadByPage2 = _interopRequireDefault(_payloadByPage);

var _language = require('./language');

var _language2 = _interopRequireDefault(_language);

var _boot = require('./boot');

var _boot2 = _interopRequireDefault(_boot);

var _application = require('./application');

var _application2 = _interopRequireDefault(_application);

var _question = require('./question');

var _question2 = _interopRequireDefault(_question);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rootReducer = (0, _redux.combineReducers)({
  featuresByCollection: _featuresByCollection2.default,
  user: _user2.default,
  payloadByPage: _payloadByPage2.default,
  language: _language2.default,
  boot: _boot2.default,
  application: _application2.default,
  question: _question2.default
});

exports.default = rootReducer;