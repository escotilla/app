'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

var INITIAL_STATE = {
  loading: false
};

var user = function user() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.REGISTER_INIT:
    case _actionTypes.LOGIN_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case _actionTypes.REGISTER_SUCCESS:
    case _actionTypes.LOGIN_SUCCESS:
      return Object.assign({}, state, {
        loading: false,
        success: true,
        token: action.token,
        email: action.email
      });
    case _actionTypes.REGISTER_FAILURE:
    case _actionTypes.LOGIN_FAILURE:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case _actionTypes.LOGOUT:
      return INITIAL_STATE;
    default:
      return state;
  }
};

exports.default = user;