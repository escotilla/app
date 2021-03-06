'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

var INITIAL_STATE = {};

var question = function question() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.FETCH_QUESTIONS_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case _actionTypes.FETCH_QUESTIONS_SUCCESS:
      return Object.assign({}, state, {
        loading: false,
        questions: action.questions
      });
    case _actionTypes.FETCH_QUESTIONS_FAILURE:
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

exports.default = question;