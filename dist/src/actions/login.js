'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.login = login;
exports.updateUserSuccess = updateUserSuccess;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _getApplications = require('./get-applications');

var _actionTypes = require('./action-types');

var _request = require('./request');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function login(body) {
  var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'login';

  return function (dispatch) {
    dispatch(loginStart(page));
    dispatch((0, _request.requestStart)(page));

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
      dispatch((0, _request.requestSuccess)(page));
      _lsCache2.default.set('user', json.data);

      return json.data;
    }).then(function (user) {
      return dispatch((0, _getApplications.getApplicationsIfExist)(user));
    }).catch(function (err) {
      dispatch(loginFailure(err, page));
      dispatch((0, _request.requestFailure)(err, page));
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
    page: page,
    user: json
  };
}

function updateUserSuccess(json) {
  _lsCache2.default.set('user', json);
  return {
    type: _actionTypes.LOAD_USER,
    user: json
  };
}

function loginFailure(err, page) {
  return {
    type: _actionTypes.LOGIN_FAILURE,
    error: err,
    page: page
  };
}