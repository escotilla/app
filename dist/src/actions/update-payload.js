'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updatePayload = updatePayload;

var _actionTypes = require('./action-types');

function updatePayload(id, page, text) {
  return {
    type: _actionTypes.UPDATE_PAYLOAD,
    id: id,
    page: page,
    text: text
  };
}