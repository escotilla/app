import fetch from 'isomorphic-fetch';
import {getApiUrl} from '../utilities/environment';
import D from 'downloadjs'

import {
  DOWNLOAD_INIT,
  DOWNLOAD_FAILURE,
  DOWNLOAD_SUCCESS,
} from './action-types';

export function download(body, filename, extension) {
  return dispatch => {
    dispatch(downloadStart());

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    return fetch(getApiUrl() + '/document/read', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    })
      .then(response => {
        return response.blob();
      })
      .then(blob => {
        return D(blob, filename, extension);
      })
      .then(() => dispatch(downloadSuccess()))
      .catch(err => {
        dispatch(downloadFailure(err));
      })
  }
}

function downloadStart() {
  return {
    type: DOWNLOAD_INIT
  }
}

export function downloadSuccess() {
  return {
    type: DOWNLOAD_SUCCESS
  }
}

function downloadFailure(err) {
  return {
    type: DOWNLOAD_FAILURE,
    error: err
  }
}