import lscache from 'ls-cache';

import {
  LOAD_USER,
  BOOT_COMPLETE
} from './action-types';

export function loadUser() {
  return dispatch => {
    const user = lscache.get('user');

    if (user) {
      dispatch(loadSuccess(user));
    }
  }
}

export function boot() {
  return dispatch => {
    dispatch(loadUser());
    dispatch(bootComplete());
  }
}
function loadSuccess(json) {
  return {
    type: LOAD_USER,
    token: json.api_token,
    email: json.email
  }
}

export function bootComplete() {
  return {
    type: BOOT_COMPLETE
  }
}