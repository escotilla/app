import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';

import {
  REGISTER_INIT,
  REGISTER_FAILURE,
  REGISTER_SUCCESS,
  UPDATE_PAYLOAD,
} from './action-types';

export function register(body) {
  return dispatch => {
    dispatch(registerStart());

    return fetch(getApiUrl() + '/user/create', {
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
        dispatch(registerSuccess(json.data));
      })
      .catch(err => {
        dispatch(registerFailure(err));
      })
  }
}

function handleErrors(response) {
  if (!response.success) {
    throw Error(response.error);
  }

  return response;
}

function registerStart() {
  return {
    type: REGISTER_INIT
  }
}

function registerSuccess(json) {
  return {
    type: REGISTER_SUCCESS,
    token: json.api_token,
    email: json.email
  }
}

function registerFailure(err) {
  return {
    type: REGISTER_FAILURE,
    error: err
  }
}