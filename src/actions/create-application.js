import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';
import lscache from 'ls-cache';

import {
  CREATE_APPLICATION_INIT,
  CREATE_APPLICATION_FAILURE,
  CREATE_APPLICATION_SUCCESS,
} from './action-types';

export function createApplication(body) {
  return dispatch => {
    dispatch(createApplicationStart());

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    return fetch(getApiUrl() + '/application/create', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    })
      .then(response => {
        return response.json();
      })
      .then(handleErrors)
      .then(json => {
        dispatch(createApplicationSuccess(json.data));
        lscache.set('application', json.data);
      })
      .catch(err => {
        dispatch(createApplicationFailure(err));
      })
  }
}

export function createApplicationWithAuth(payload) {
  return (dispatch, getState) => {
    const state = getState();
    if (state.user && state.user.api_token) {
      dispatch(createApplication(
        {
          payload: payload,
          api_token: state.user.api_token
        }
      ))
    }
  }
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function createApplicationStart() {
  return {
    type: CREATE_APPLICATION_INIT
  }
}

function createApplicationSuccess(json) {
  return {
    type: CREATE_APPLICATION_SUCCESS,
    applications: json
  }
}

function createApplicationFailure(err) {
  return {
    type: CREATE_APPLICATION_FAILURE,
    error: err
  }
}