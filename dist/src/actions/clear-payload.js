'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearPayload = clearPayload;

var _actionTypes = require('./action-types');

function clearPayload(page) {
  return {
    type: _actionTypes.CLEAR_PAYLOAD,
    page: page
  };
}