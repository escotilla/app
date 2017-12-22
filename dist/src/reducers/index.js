'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _redux = require('redux');

var _featuresByCollection = require('./featuresByCollection');

var _featuresByCollection2 = _interopRequireDefault(_featuresByCollection);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _payload = require('./payload');

var _payload2 = _interopRequireDefault(_payload);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rootReducer = (0, _redux.combineReducers)({
  featuresByCollection: _featuresByCollection2.default,
  user: _user2.default,
  payload: _payload2.default
});

exports.default = rootReducer;