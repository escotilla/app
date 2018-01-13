'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getApplications = getApplications;
exports.getApplicationsIfExist = getApplicationsIfExist;
exports.getApplicationsSuccess = getApplicationsSuccess;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getApplications(body) {
  return function (dispatch) {
    dispatch(getApplicationsStart());

    var headers = new Headers({
      'Content-Type': 'application/json'
    });

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/application/read', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    }).then(function (response) {
      return response.json();
    }).then(handleErrors).then(function (json) {
      dispatch(getApplicationsSuccess(json.data));
      _lsCache2.default.set('application', json.data);
    }).catch(function (err) {
      dispatch(getApplicationsFailure(err));
    });
  };
}

function getApplicationsIfExist() {
  return function (dispatch, getState) {
    var state = getState();
    if (shouldGetApplications(state)) {
      dispatch(getApplications({ 'api_token': state.user.api_token }));
    }
  };
}

function shouldGetApplications(state) {
  var user = state.user;

  return user.application_ids && user.application_ids.length > 0;
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function getApplicationsStart() {
  return {
    type: _actionTypes.GET_APPLICATIONS_INIT
  };
}

function getApplicationsSuccess(json) {
  return {
    type: _actionTypes.GET_APPLICATIONS_SUCCESS,
    applications: json
  };
}

function getApplicationsFailure(err) {
  return {
    type: _actionTypes.GET_APPLICATIONS_FAILURE,
    error: err
  };
}