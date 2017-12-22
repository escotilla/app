'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadUser = loadUser;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lscache = require('lscache');

var _lscache2 = _interopRequireDefault(_lscache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function loadUser() {
  var user = _lscache2.default.get('user');
  console.log(JSON.stringify(user), 'us');

  if (user && user.api_token) {
    return function (dispatch) {
      dispatch(loginSuccess(user));
    };
  }
}

function handleErrors(response) {
  if (!response.success) {
    throw Error(response.error);
  }

  return response;
}

function loginStart() {
  return {
    type: _actionTypes.LOGIN_INIT
  };
}

function loginSuccess(json) {
  return {
    type: _actionTypes.LOGIN_SUCCESS,
    token: json.api_token,
    email: json.email
  };
}

function loginFailure(err) {
  return {
    type: _actionTypes.LOGIN_FAILURE,
    error: err
  };
}