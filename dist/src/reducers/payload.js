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

var payload = function payload() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { payload: INITIAL_STATE };
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.UPDATE_PAYLOAD:
      return Object.assign({}, state, _defineProperty({}, action.id, action.text));
    case _actionTypes.REGISTER_SUCCESS:
    case _actionTypes.REGISTER_FAILURE:
      return {};
    default:
      return state;
  }
};

exports.default = payload;