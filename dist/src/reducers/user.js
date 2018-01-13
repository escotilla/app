'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

var INITIAL_STATE = {};

var user = function user() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.REGISTER_SUCCESS:
    case _actionTypes.LOGIN_SUCCESS:
    case _actionTypes.LOAD_USER:
      return Object.assign({}, state, action.user);
    case _actionTypes.LOGOUT:
      return INITIAL_STATE;
    default:
      return state;
  }
};

exports.default = user;