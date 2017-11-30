'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _redux = require('redux');

var _featuresByCollection = require('./featuresByCollection');

var _featuresByCollection2 = _interopRequireDefault(_featuresByCollection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rootReducer = (0, _redux.combineReducers)({ featuresByCollection: _featuresByCollection2.default });

exports.default = rootReducer;