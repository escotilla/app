'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.login = login;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lscache = require('lscache');

var _lscache2 = _interopRequireDefault(_lscache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function login(body) {
  return function (dispatch) {
    dispatch(loginStart());

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/user/login', {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(function (response) {
      return response.json();
    }).then(handleErrors).then(function (json) {
      dispatch(loginSuccess(json.data));
      _lscache2.default.set('user', json.data);
    }).catch(function (err) {
      dispatch(loginFailure(err));
    });
  };
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