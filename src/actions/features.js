import fetch from 'isomorphic-fetch';
import {getApiUrl, handleErrors} from '../utilities/environment';
import {
  FETCH_FEATURES_INIT,
  FETCH_FEATURES_FAILURE,
  FETCH_FEATURES_SUCCESS
} from './action-types';

function fetchFeatures(collection) {
  return dispatch => {
    dispatch(featuresStart(collection));

    return fetch(getApiUrl() + 'features', {
      method: "POST",
      body: JSON.stringify({
        collection: collection
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => {
        return response.json();
      })
      .then(handleErrors)
      .then(json => {
        dispatch(featuresSuccess(collection, json.data));
      })
      .catch(err => {
        dispatch(featuresFailure(collection, err));
      })
  }
}

function featuresStart(collection) {
  return {
    type: FETCH_FEATURES_INIT,
    collection: collection
  }
}

function featuresSuccess(collection, features) {
  return {
    type: FETCH_FEATURES_SUCCESS,
    features: features,
    collection: collection
  }
}

function featuresFailure(collection, err) {
  return {
    type: FETCH_FEATURES_FAILURE,
    error: err,
    collection: collection
  }
}

function shouldFetchFeatures(state, collection) {
  const features = state.featuresByCollection[collection];
  return !features;
}

export function fetchFeaturesIfNeeded(collection) {
  return (dispatch, getState) => {
    if (shouldFetchFeatures(getState(), collection)) {
      return dispatch(fetchFeatures(collection));
    }
  }
}