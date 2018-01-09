import lscache from 'ls-cache';
import {getApplicationsSuccess} from './get-applications';
import {fetchQuestionsIfNeeded} from './fetch-questions';
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

    return user;
  }
}
export function loadApplication() {
  return dispatch => {
    const user = lscache.get('application');

    if (user) {
      dispatch(getApplicationsSuccess(user));
    }

    return user;
  }
}

export function boot() {
  return dispatch => {
    dispatch(fetchQuestionsIfNeeded());
    const user = dispatch(loadUser());
    if (user) {
      dispatch(loadApplication());
    }
    dispatch(bootComplete());
  }
}
function loadSuccess(json) {
  return {
    type: LOAD_USER,
    token: json.api_token,
    email: json.email,
    application_ids: json.application_ids
  }
}

export function bootComplete() {
  return {
    type: BOOT_COMPLETE
  }
}