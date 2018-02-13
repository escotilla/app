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
    dispatch(fetchQuestionsIfNeeded())
      .then(() => dispatch(loadUser()))
      .then(() => dispatch(bootComplete()));
  }
}

export function loadSuccess(json) {
  return {
    type: LOAD_USER,
    user: json
  }
}

export function bootComplete() {
  return {
    type: BOOT_COMPLETE
  }
}