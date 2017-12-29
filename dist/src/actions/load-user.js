'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadUser = loadUser;
exports.bootComplete = bootComplete;

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function loadUser() {
  return function (dispatch) {
    var user = _lsCache2.default.get('user');

    if (user) {
      dispatch(loadSuccess(user));
    }

    dispatch(bootComplete());
  };
}

function loadSuccess(json) {
  return {
    type: _actionTypes.LOAD_USER,
    token: json.api_token,
    email: json.email
  };
}

function bootComplete() {
  return {
    type: _actionTypes.BOOT_COMPLETE
  };
}