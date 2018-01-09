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
    dispatch(fetchQuestionsStart());

    const questions = lscache.get('questions');

    if (questions) {
      return dispatch(fetchQuestionsSuccess(questions));
    }

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    return fetch(getApiUrl() + '/question/read')
      .then(response => {
        return response.json();
      })
      .then(handleErrors)
      .then(json => {
        dispatch(fetchQuestionsSuccess(json.data));
        lscache.set('questions', json.data);
      })
      .catch(err => {
        dispatch(fetchQuestionsFailure(err));
      })
  }
}

export function fetchQuestionsIfNeeded() {
  return (dispatch, getState) => {
    const state = getState();
    if (shouldFetchApplications(state)) {
      dispatch(fetchQuestions());
    }
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