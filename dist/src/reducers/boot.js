'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

var INITIAL_STATE = {
  booting: true
};

var boot = function boot() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.BOOT_COMPLETE:
      return Object.assign({}, state, {
        booting: false
      });
    default:
      return state;
  }
};

exports.default = boot;