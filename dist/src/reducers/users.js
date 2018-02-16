'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

var INITIAL_STATE = {
  loading: true
};

var users = function users() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.GET_USERS_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case _actionTypes.GET_USERS_FAILURE:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case _actionTypes.GET_USERS_SUCCESS:
      return Object.assign({}, state, {
        loading: false,
        users: action.users,
        current_page: action.current_page,
        last_page: action.last_page
      });
    default:
      return state;
  }
};

exports.default = users;