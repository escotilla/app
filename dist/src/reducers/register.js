'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var INITIAL_STATE = {
  email: '',
  name: '',
  password: ''
};

var register = function register() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { payload: INITIAL_STATE };
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.UPDATE_PAYLOAD:
      return Object.assign({}, state, {
        payload: payload(state.payload, action)
      });
    case _actionTypes.REGISTER_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case _actionTypes.REGISTER_SUCCESS:
      return Object.assign({}, state, {
        loading: false,
        success: true
      });
    case _actionTypes.REGISTER_FAILURE:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    default:
      return state;
  }
};

var payload = function payload() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  return Object.assign({}, state, _defineProperty({}, action.id, action.text));
};

exports.default = register;