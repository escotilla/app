'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requestStart = requestStart;
exports.requestSuccess = requestSuccess;
exports.requestFailure = requestFailure;

var _actionTypes = require('./action-types');

function requestStart(page) {
  return {
    type: _actionTypes.REQUEST_INIT,
    page: page
  };
}

function requestSuccess(page) {
  return {
    type: _actionTypes.REQUEST_SUCCESS,
    page: page
  };
}

function requestFailure(err, page) {
  return {
    type: _actionTypes.REQUEST_FAILURE,
    error: err,
    page: page
  };
}