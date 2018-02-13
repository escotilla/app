import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';
import lscache from 'ls-cache';

import {
  FETCH_QUESTIONS_INIT,
  FETCH_QUESTIONS_FAILURE,
  FETCH_QUESTIONS_SUCCESS,
} from './action-types';

export function fetchQuestions() {
  return dispatch => {
    return new Promise((resolve, reject) => {
      dispatch(fetchQuestionsStart());

      const questions = lscache.get('questions');

      if (questions) {
        dispatch(fetchQuestionsSuccess(questions));
        return resolve(questions);
      }

      return fetch(getApiUrl() + '/question/read')
        .then(response => {
          return response.json();
        })
        .then(handleErrors)
        .then(json => {
          dispatch(fetchQuestionsSuccess(json.data));
          lscache.set('questions', json.data);
          resolve(json);
        })
        .catch(err => {
          dispatch(fetchQuestionsFailure(err));
          reject(err);
        })
    });
  }
}

export function fetchQuestionsIfNeeded() {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      const state = getState();
      if (shouldFetchApplications(state)) {
        return dispatch(fetchQuestions())
          .then(json => resolve(json))
          .catch(err => reject(err));
      }

      resolve();
    });
  }
}

function shouldFetchApplications(state) {
  const question = state.question;

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
    type: FETCH_QUESTIONS_INIT
  }
}

export function fetchQuestionsSuccess(json) {
  return {
    type: FETCH_QUESTIONS_SUCCESS,
    questions: json
  }
}

function fetchQuestionsFailure(err) {
  return {
    type: FETCH_QUESTIONS_FAILURE,
    error: err
  }
}