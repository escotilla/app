'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

var INITIAL_STATE = 'closed';

var language = function language() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.SET_MENU:
      return action.menu;
    default:
      return state;
  }
};

exports.default = language;