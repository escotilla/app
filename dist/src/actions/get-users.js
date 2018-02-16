'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUsers = getUsers;
exports.getUsersIfAdmin = getUsersIfAdmin;
exports.getUsersSuccess = getUsersSuccess;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getUsers(body) {
  return function (dispatch) {
    dispatch(getUsersStart());

    var headers = new Headers({
      'Content-Type': 'application/json'
    });

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/user/read', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    }).then(function (response) {
      return response.json();
    }).then(handleErrors).then(function (json) {
      dispatch(getUsersSuccess(json.data));
    }).catch(function (err) {
      dispatch(getUsersFailure(err));
    });
  };
}

function getUsersIfAdmin() {
  return function (dispatch, getState) {
    var state = getState();
    if (shouldGetApplications(state)) {
      dispatch(getUsers({ 'api_token': state.user.api_token }));
    }
  };
}

function shouldGetApplications(state) {
  var user = state.user;

  return user.role === "admin";
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function getUsersStart() {
  return {
    type: _actionTypes.GET_USERS_INIT
  };
}

function getUsersSuccess(json) {
  return {
    type: _actionTypes.GET_USERS_SUCCESS,
    users: json.data,
    current_page: json.current_page,
    last_page: json.last_page
  };
}

function getUsersFailure(err) {
  return {
    type: _actionTypes.GET_USERS_FAILURE,
    error: err
  };
}