'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createApplication = createApplication;
exports.createApplicationWithAuth = createApplicationWithAuth;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createApplication(body) {
  return function (dispatch) {
    dispatch(createApplicationStart());

    var headers = new Headers({
      'Content-Type': 'application/json'
    });

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/application/create', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    }).then(function (response) {
      return response.json();
    }).then(handleErrors).then(function (json) {
      dispatch(createApplicationSuccess(json.data));
      _lsCache2.default.set('application', json.data);
    }).catch(function (err) {
      dispatch(createApplicationFailure(err));
    });
  };
}

function createApplicationWithAuth(payload) {
  return function (dispatch, getState) {
    var state = getState();
    if (state.user && state.user.api_token) {
      dispatch(createApplication({
        payload: payload,
        api_token: state.user.api_token
      }));
    }
  };
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function createApplicationStart() {
  return {
    type: _actionTypes.CREATE_APPLICATION_INIT
  };
}

function createApplicationSuccess(json) {
  return {
    type: _actionTypes.CREATE_APPLICATION_SUCCESS,
    applications: json
  };
}

function createApplicationFailure(err) {
  return {
    type: _actionTypes.CREATE_APPLICATION_FAILURE,
    error: err
  };
}