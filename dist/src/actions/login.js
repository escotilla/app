'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.login = login;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function login(body) {
  var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'login';

  return function (dispatch) {
    dispatch(loginStart(page));

    var headers = new Headers({
      'Content-Type': 'application/json'
    });

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/user/login', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    }).then(function (response) {
      return response.json();
    }).then(handleErrors).then(function (json) {
      dispatch(loginSuccess(json.data, page));
      _lsCache2.default.set('user', json.data);
    }).catch(function (err) {
      dispatch(loginFailure(err, page));
    });
  };
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function loginStart(page) {
  return {
    type: _actionTypes.LOGIN_INIT,
    page: page
  };
}

function loginSuccess(json, page) {
  return {
    type: _actionTypes.LOGIN_SUCCESS,
    token: json.api_token,
    email: json.email,
    page: page
  };
}

function loginFailure(err, page) {
  return {
    type: _actionTypes.LOGIN_FAILURE,
    error: err,
    page: page
  };
}