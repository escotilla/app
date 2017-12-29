'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require('../actions/action-types');

var _loadUser = require('../actions/load-user');

var INITIAL_STATE = {
  booting: true,
  actions: [{
    action: _loadUser.loadUser
  }, {
    action: _loadUser.bootComplete
  }]
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