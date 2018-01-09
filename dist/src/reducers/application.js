'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

var INITIAL_STATE = {};

var application = function application() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.GET_APPLICATIONS_INIT:
    case _actionTypes.CREATE_APPLICATION_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case _actionTypes.GET_APPLICATIONS_SUCCESS:
    case _actionTypes.CREATE_APPLICATION_SUCCESS:
      return Object.assign({}, state, {
        loading: false,
        applications: action.applications,
        error: null,
        success: true
      });
    case _actionTypes.GET_APPLICATIONS_FAILURE:
    case _actionTypes.CREATE_APPLICATION_FAILURE:
      return Object.assign({}, state, {
        loading: false,
        error: {
          message: action.error.message || undefined,
          code: action.error.code || 500
        }
      });
    case _actionTypes.LOGOUT:
      return INITIAL_STATE;
    default:
      return state;
  }
};

exports.default = application;