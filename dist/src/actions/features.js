'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchFeaturesIfNeeded = fetchFeaturesIfNeeded;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fetchFeatures(collection) {
  return function (dispatch) {
    dispatch(featuresStart(collection));
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + 'features', {
      method: "POST",
      body: JSON.stringify({
        collection: collection
      }),
      headers: headers,
      mode: 'cors'
    }).then(function (response) {
      return response.json();
    }).then(_environment.handleErrors).then(function (json) {
      dispatch(featuresSuccess(collection, json.data));
    }).catch(function (err) {
      dispatch(featuresFailure(collection, err));
    });
  };
}

function featuresStart(collection) {
  return {
    type: _actionTypes.FETCH_FEATURES_INIT,
    collection: collection
  };
}

function featuresSuccess(collection, features) {
  return {
    type: _actionTypes.FETCH_FEATURES_SUCCESS,
    features: features,
    collection: collection
  };
}

function featuresFailure(collection, err) {
  return {
    type: _actionTypes.FETCH_FEATURES_FAILURE,
    error: err,
    collection: collection
  };
}

function shouldFetchFeatures(state, collection) {
  var features = state.featuresByCollection[collection];
  return !features;
}

function fetchFeaturesIfNeeded(collection) {
  return function (dispatch, getState) {
    if (shouldFetchFeatures(getState(), collection)) {
      return dispatch(fetchFeatures(collection));
    }
  };
}