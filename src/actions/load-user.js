import lscache from 'ls-cache';
import {getApplicationsSuccess} from './get-applications';
import {fetchQuestionsIfNeeded} from './fetch-questions';
import {changeLanguage} from './change-language';
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

export function loadLanguage() {
  return dispatch => {
    const language = lscache.get('language');

    if (language) {
      dispatch(changeLanguage(language));
    }

    return language;
  }
}

export function boot() {
  return dispatch => {
    dispatch(fetchQuestionsIfNeeded())
      .then(() => dispatch(loadUser()))
      .then(() => dispatch(loadLanguage()))
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