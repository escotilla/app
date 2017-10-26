import {
  FETCH_FEATURES_INIT,
  FETCH_FEATURES_FAILURE,
  FETCH_FEATURES_SUCCESS
} from '../actions/action-types';

const INITIAL_STATE = {
  loading: false,
  featureCollection: {},
  error: null
};

const features = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case FETCH_FEATURES_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case FETCH_FEATURES_FAILURE:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case FETCH_FEATURES_SUCCESS:
      return Object.assign({}, state, {
        loading: false,
        featureCollection: {"type": "FeatureCollection", "features": action.features}
      });
    default:
      return state
  }
};

const featuresByCollection = (state = {}, action) => {
  switch (action.type) {
    case FETCH_FEATURES_INIT:
    case FETCH_FEATURES_SUCCESS:
    case FETCH_FEATURES_FAILURE:
      return Object.assign({}, state, {
        [action.collection]: features(state[action.collection], action)
      });
    default:
      return state
  }
};

export default featuresByCollection;