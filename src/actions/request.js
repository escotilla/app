import {
  REQUEST_INIT,
  REQUEST_FAILURE,
  REQUEST_SUCCESS,
} from './action-types';

export function requestStart(page) {
  return {
    type: REQUEST_INIT,
    page: page
  }
}

export function requestSuccess(page) {
  return {
    type: REQUEST_SUCCESS,
    page: page
  }
}

export function requestFailure(err, page) {
  return {
    type: REQUEST_FAILURE,
    error: err,
    page: page
  }
}