'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logout = logout;

var _actionTypes = require('./action-types');

function logout() {
  return {
    type: _actionTypes.LOGOUT
  };
}