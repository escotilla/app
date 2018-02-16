'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchQuestions = fetchQuestions;
exports.fetchQuestionsIfNeeded = fetchQuestionsIfNeeded;
exports.fetchQuestionsSuccess = fetchQuestionsSuccess;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fetchQuestions() {
  return function (dispatch) {
    return new Promise(function (resolve, reject) {
      dispatch(fetchQuestionsStart());

      var questions = _lsCache2.default.get('questions');

      if (questions) {
        dispatch(fetchQuestionsSuccess(questions));
        return resolve(questions);
      }

      return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/question/read').then(function (response) {
        return response.json();
      }).then(handleErrors).then(function (json) {
        dispatch(fetchQuestionsSuccess(json.data));
        _lsCache2.default.set('questions', json.data);
        resolve(json);
      }).catch(function (err) {
        dispatch(fetchQuestionsFailure(err));
        reject(err);
      });
    });
  };
}

function fetchQuestionsIfNeeded() {
  return function (dispatch, getState) {
    return new Promise(function (resolve, reject) {
      var state = getState();
      if (shouldFetchApplications(state)) {
        return dispatch(fetchQuestions()).then(function (json) {
          return resolve(json);
        }).catch(function (err) {
          return reject(err);
        });
      }

      resolve();
    });
  };
}

function shouldFetchApplications(state) {
  var question = state.question;

  return !(question.questions && question.questions.length === 0);
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function fetchQuestionsStart() {
  return {
    type: _actionTypes.FETCH_QUESTIONS_INIT
  };
}

function fetchQuestionsSuccess(json) {
  return {
    type: _actionTypes.FETCH_QUESTIONS_SUCCESS,
    questions: json
  };
}

function fetchQuestionsFailure(err) {
  return {
    type: _actionTypes.FETCH_QUESTIONS_FAILURE,
    error: err
  };
}