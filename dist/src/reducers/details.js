'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var INITIAL_STATE = {
  email: '',
  name: '',
  message: ''
};

var menu = function menu() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { payload: INITIAL_STATE };
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.UPDATE_PAYLOAD:
      return Object.assign({}, state, {
        payload: payload(state.payload, action)
      });
    case _actionTypes.CONTACT_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case _actionTypes.CONTACT_SUCCESS:
      return Object.assign({}, state, {
        loading: false,
        success: true
      });
    case _actionTypes.CONTACT_FAILURE:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case _actionTypes.OPEN_CONTACT:
      return Object.assign({}, state, {
        open: true
      });
    case _actionTypes.CLOSE_CONTACT:
      return Object.assign({}, state, { open: false });
    default:
      return state;
  }
};

var payload = function payload() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  return Object.assign({}, state, _defineProperty({}, action.id, action.text));
};

exports.default = menu;