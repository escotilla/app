import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';
import lscache from 'ls-cache';

import {
  REGISTER_INIT,
  REGISTER_FAILURE,
  REGISTER_SUCCESS,
  UPDATE_PAYLOAD,
} from './action-types';

export function register(body, page = 'register') {
  return dispatch => {
    dispatch(registerStart(page));

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    return fetch(getApiUrl() + '/user/create', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    })
      .then(response => {
        return response.json();
      })
      .then(handleErrors)
      .then(json => {
        dispatch(registerSuccess(json.data, page));
        lscache.set('user', json.data);
      })
      .catch(err => {
        dispatch(registerFailure(err, page));
      })
  }
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function registerStart(page) {
  return {
    type: REGISTER_INIT,
    page: page
  }
}

function registerSuccess(json, page) {
  return {
    type: REGISTER_SUCCESS,
    token: json.api_token,
    email: json.email,
    name: json.name,
    page: page,
    application_ids: json.application_ids,
    user: json
  }
}

function registerFailure(err, page) {
  return {
    type: REGISTER_FAILURE,
    error: err,
    page: page
  }
}