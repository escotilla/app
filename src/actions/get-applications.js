import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';
import lscache from 'ls-cache';

import {
  GET_APPLICATIONS_INIT,
  GET_APPLICATIONS_FAILURE,
  GET_APPLICATIONS_SUCCESS,
} from './action-types';

export function getApplications(body) {
  return dispatch => {
    dispatch(getApplicationsStart());

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    return fetch(getApiUrl() + '/application/read', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    })
      .then(response => {
        return response.json();
      })
      .then(handleErrors)
      .then(json => {
        dispatch(getApplicationsSuccess(json.data));
        lscache.set('application', json.data);
      })
      .catch(err => {
        dispatch(getApplicationsFailure(err));
      })
  }
}

export function getApplicationsIfExist() {
  return (dispatch, getState) => {
    const state = getState();
    if (shouldGetApplications(state)) {
      dispatch(getApplications({'api_token': state.user.api_token}));
    }
  }
}

function shouldGetApplications(state) {
  const user = state.user;

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
    type: GET_APPLICATIONS_INIT
  }
}

export function getApplicationsSuccess(json) {
  return {
    type: GET_APPLICATIONS_SUCCESS,
    applications: json
  }
}

function getApplicationsFailure(err) {
  return {
    type: GET_APPLICATIONS_FAILURE,
    error: err
  }
}