import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';
import lscache from 'ls-cache';

import {
  GET_USERS_INIT,
  GET_USERS_FAILURE,
  GET_USERS_SUCCESS,
} from './action-types';

export function getUsers(body) {
  return dispatch => {
    dispatch(getUsersStart());

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    return fetch(getApiUrl() + '/user/read', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    })
      .then(response => {
        return response.json();
      })
      .then(handleErrors)
      .then(json => {
        dispatch(getUsersSuccess(json.data));
      })
      .catch(err => {
        dispatch(getUsersFailure(err));
      })
  }
}

export function getUsersIfAdmin() {
  return (dispatch, getState) => {
    const state = getState();
    if (shouldGetApplications(state)) {
      dispatch(getUsers({'api_token': state.user.api_token}));
    }
  }
}

function shouldGetApplications(state) {
  const user = state.user;

  return user.role === "admin";
}

function handleErrors(response) {
  if (!response.success) {
    throw response;
  }

  return response;
}

function getUsersStart() {
  return {
    type: GET_USERS_INIT
  }
}

export function getUsersSuccess(json) {
  return {
    type: GET_USERS_SUCCESS,
    users: json.data,
    current_page: json.current_page,
    last_page: json.last_page
  }
}

function getUsersFailure(err) {
  return {
    type: GET_USERS_FAILURE,
    error: err
  }
}