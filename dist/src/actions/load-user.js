'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadUser = loadUser;
exports.loadApplication = loadApplication;
exports.boot = boot;
exports.loadSuccess = loadSuccess;
exports.bootComplete = bootComplete;

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _getApplications = require('./get-applications');

var _fetchQuestions = require('./fetch-questions');

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function loadUser() {
  return function (dispatch) {
    var user = _lsCache2.default.get('user');

    if (user) {
      dispatch(loadSuccess(user));
    }

    return user;
  };
}
function loadApplication() {
  return function (dispatch) {
    var user = _lsCache2.default.get('application');

    if (user) {
      dispatch((0, _getApplications.getApplicationsSuccess)(user));
    }

    return user;
  };
}

function boot() {
  return function (dispatch) {
    dispatch((0, _fetchQuestions.fetchQuestionsIfNeeded)());
    dispatch(loadUser());

    dispatch(bootComplete());
  };
}

function loadSuccess(json) {
  return {
    type: _actionTypes.LOAD_USER,
    user: json
  };
}

function bootComplete() {
  return {
    type: _actionTypes.BOOT_COMPLETE
  };
}