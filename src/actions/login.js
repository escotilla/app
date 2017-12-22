import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';

import {
  LOGIN_INIT,
  LOGIN_FAILURE,
  LOGIN_SUCCESS,
} from './action-types';

export function login(body) {
  return dispatch => {
    dispatch(loginStart());

    return fetch(getApiUrl() + '/user/login', {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => {
        return response.json();
      })
      .then(handleErrors)
      .then(json => {
        dispatch(loginSuccess(json.data));
      })
      .catch(err => {
        dispatch(loginFailure(err));
      })
  }
}

function handleErrors(response) {
  if (!response.success) {
    throw Error(response.error);
  }

  return response;
}

function loginStart() {
  return {
    type: LOGIN_INIT
  }
}

function loginSuccess(json) {
  return {
    type: LOGIN_SUCCESS,
    token: json.api_token,
    email: json.email
  }
}

function loginFailure(err) {
  return {
    type: LOGIN_FAILURE,
    error: err
  }
}