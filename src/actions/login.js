import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';
import lscache from 'ls-cache';

import {
  LOGIN_INIT,
  LOGIN_FAILURE,
  LOGIN_SUCCESS,
} from './action-types';

export function login(body, page = 'login') {
  return dispatch => {
    dispatch(loginStart(page));

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    return fetch(getApiUrl() + '/user/login', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    })
      .then(response => {
        return response.json();
      })
      .then(handleErrors)
      .then(json => {
        dispatch(loginSuccess(json.data, page));
        lscache.set('user', json.data);
      })
      .catch(err => {
        dispatch(loginFailure(err, page));
      })
  }
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function loginStart(page) {
  return {
    type: LOGIN_INIT,
    page: page
  }
}

function loginSuccess(json, page) {
  return {
    type: LOGIN_SUCCESS,
    token: json.api_token,
    email: json.email,
    page: page
  }
}

function loginFailure(err, page) {
  return {
    type: LOGIN_FAILURE,
    error: err,
    page: page
  }
}