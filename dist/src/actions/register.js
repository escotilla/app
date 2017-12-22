'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function register(body) {
  return function (dispatch) {
    dispatch(registerStart());

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/user/create', {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(function (response) {
      return response.json();
    }).then(handleErrors).then(function (json) {
      json.name = body.name;
      dispatch(registerSuccess(json.data));
    }).catch(function (err) {
      dispatch(registerFailure(err));
    });
  };
}

function handleErrors(response) {
  if (!response.success) {
    throw Error(response.error);
  }

  return response;
}

function registerStart() {
  return {
    type: _actionTypes.REGISTER_INIT
  };
}

function registerSuccess(json) {
  return {
    type: _actionTypes.REGISTER_SUCCESS,
    token: json.api_token,
    email: json.email,
    name: json.name
  };
}

function registerFailure(err) {
  return {
    type: _actionTypes.REGISTER_FAILURE,
    error: err
  };
}