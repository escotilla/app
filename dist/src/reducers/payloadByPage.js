'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var INITIAL_STATE = {};

var payload = function payload() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    payload: {},
    loading: false,
    error: null,
    message: null,
    success: null
  };
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.UPDATE_PAYLOAD:
      return Object.assign({}, state, {
        payload: updatePayload(state.payload, action)
      });
    case _actionTypes.LOGIN_INIT:
    case _actionTypes.REGISTER_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case _actionTypes.REGISTER_SUCCESS:
    case _actionTypes.LOGIN_SUCCESS:
      return Object.assign({}, state, {
        payload: INITIAL_STATE,
        loading: false,
        success: true,
        error: null
      });
    case _actionTypes.REGISTER_FAILURE:
    case _actionTypes.LOGIN_FAILURE:
      return Object.assign({}, state, {
        loading: false,
        error: {
          message: action.error.message || undefined,
          code: action.error.code || 500
        }
      });
    default:
      return state;
  }
};

var updatePayload = function updatePayload(state, action) {
  switch (action.type) {
    case _actionTypes.UPDATE_PAYLOAD:
      return Object.assign({}, state, _defineProperty({}, action.id, action.text));
    default:
      return state;
  }
};

var payloadByPage = function payloadByPage() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.UPDATE_PAYLOAD:
    case _actionTypes.REGISTER_FAILURE:
    case _actionTypes.REGISTER_SUCCESS:
    case _actionTypes.REGISTER_INIT:
    case _actionTypes.LOGIN_SUCCESS:
    case _actionTypes.LOGIN_FAILURE:
    case _actionTypes.LOGIN_INIT:
    case _actionTypes.CLEAR_PAYLOAD:
      return Object.assign({}, state, _defineProperty({}, action.page, payload(state[action.page], action)));
    case _actionTypes.LOGOUT:
      return {};
    default:
      return state;
  }
};

exports.default = payloadByPage;