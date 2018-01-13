'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function register(body) {
  var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'register';

  return function (dispatch) {
    dispatch(registerStart(page));

    var headers = new Headers({
      'Content-Type': 'application/json'
    });

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/user/create', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    }).then(function (response) {
      return response.json();
    }).then(handleErrors).then(function (json) {
      dispatch(registerSuccess(json.data, page));
      _lsCache2.default.set('user', json.data);
    }).catch(function (err) {
      dispatch(registerFailure(err, page));
    });
  };
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function registerStart(page) {
  return {
    type: _actionTypes.REGISTER_INIT,
    page: page
  };
}

function registerSuccess(json, page) {
  return {
    type: _actionTypes.REGISTER_SUCCESS,
    token: json.api_token,
    email: json.email,
    name: json.name,
    page: page,
    application_ids: json.application_ids,
    user: json
  };
}

function registerFailure(err, page) {
  return {
    type: _actionTypes.REGISTER_FAILURE,
    error: err,
    page: page
  };
}