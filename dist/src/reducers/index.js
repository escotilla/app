'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _redux = require('redux');

var _featuresByCollection = require('./featuresByCollection');

var _featuresByCollection2 = _interopRequireDefault(_featuresByCollection);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _users = require('./users');

var _users2 = _interopRequireDefault(_users);

var _payloadByPage = require('./payloadByPage');

var _payloadByPage2 = _interopRequireDefault(_payloadByPage);

var _language = require('./language');

var _language2 = _interopRequireDefault(_language);

var _boot = require('./boot');

var _boot2 = _interopRequireDefault(_boot);

var _file = require('./file');

var _file2 = _interopRequireDefault(_file);

var _application = require('./application');

var _application2 = _interopRequireDefault(_application);

var _question = require('./question');

var _question2 = _interopRequireDefault(_question);

var _menu = require('./menu');

var _menu2 = _interopRequireDefault(_menu);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rootReducer = (0, _redux.combineReducers)({
  featuresByCollection: _featuresByCollection2.default,
  user: _user2.default,
  users: _users2.default,
  payloadByPage: _payloadByPage2.default,
  language: _language2.default,
  boot: _boot2.default,
  application: _application2.default,
  question: _question2.default,
  file: _file2.default,
  menu: _menu2.default
});

exports.default = rootReducer;