import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';
import lscache from 'ls-cache';
import {clearPayload} from './clear-payload';

import {
  UPDATE_APPLICATION_INIT,
  UPDATE_APPLICATION_FAILURE,
  UPDATE_APPLICATION_SUCCESS,
} from './action-types';

export function updateApplication(body, page) {
  return dispatch => {
    dispatch(updateApplicationStart());

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    return fetch(getApiUrl() + '/application/update', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    })
      .then(response => {
        return response.json();
      })
      .then(handleErrors)
      .then(json => {
        dispatch(updateApplicationSuccess(json.data));
        lscache.set('user', json.data);
      })
      .then(() => dispatch(clearPayload(page)))
      .catch(err => {
        dispatch(updateApplicationFailure(err));
      })
  }
}

export function updateApplicationWithAuth(payload, applicationId, page) {
  return (dispatch, getState) => {
    const state = getState();
    if (state.user && state.user.api_token) {
      dispatch(updateApplication(
        {
          payload: payload,
          api_token: state.user.api_token,
          application_id: applicationId
        }, page
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

function updateApplicationStart() {
  return {
    type: UPDATE_APPLICATION_INIT
  }
}

function updateApplicationSuccess(json) {
  return {
    type: UPDATE_APPLICATION_SUCCESS,
    user: json
  }
}

function updateApplicationFailure(err) {
  return {
    type: UPDATE_APPLICATION_FAILURE,
    error: err
  }
}