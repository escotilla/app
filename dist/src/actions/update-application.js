'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateApplication = updateApplication;
exports.updateApplicationWithAuth = updateApplicationWithAuth;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _clearPayload = require('./clear-payload');

var _actionTypes = require('./action-types');

var _request = require('./request');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function updateApplication(body, page) {
  return function (dispatch) {
    dispatch(updateApplicationStart());
    dispatch((0, _request.requestStart)(page));

    var headers = new Headers({
      'Content-Type': 'application/json'
    });

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/application/update', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    }).then(function (response) {
      return response.json();
    }).then(handleErrors).then(function (json) {
      dispatch(updateApplicationSuccess(json.data));
      dispatch((0, _request.requestSuccess)(page));
      _lsCache2.default.set('user', json.data);
    }).then(function () {
      return dispatch((0, _clearPayload.clearPayload)(page));
    }).catch(function (err) {
      dispatch(updateApplicationFailure(err));
      dispatch((0, _request.requestFailure)(err, page));
    });
  };
}

function updateApplicationWithAuth(payload, applicationId, page) {
  return function (dispatch, getState) {
    var state = getState();
    if (state.user && state.user.api_token) {
      dispatch(updateApplication({
        payload: payload,
        api_token: state.user.api_token,
        application_id: applicationId
      }, page));
    }
  };
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function updateApplicationStart() {
  return {
    type: _actionTypes.UPDATE_APPLICATION_INIT
  };
}

function updateApplicationSuccess(json) {
  return {
    type: _actionTypes.UPDATE_APPLICATION_SUCCESS,
    user: json
  };
}

function updateApplicationFailure(err) {
  return {
    type: _actionTypes.UPDATE_APPLICATION_FAILURE,
    error: err
  };
}