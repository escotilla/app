'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logout = logout;

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function logout() {
  _lsCache2.default.remove('user');
  _lsCache2.default.remove('application');

  return {
    type: _actionTypes.LOGOUT
  };
}