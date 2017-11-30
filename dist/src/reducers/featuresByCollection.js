"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actionTypes = require("../actions/action-types");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var INITIAL_STATE = {
  loading: false,
  featureCollection: {},
  error: null
};

var features = function features() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_STATE;
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.FETCH_FEATURES_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case _actionTypes.FETCH_FEATURES_FAILURE:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case _actionTypes.FETCH_FEATURES_SUCCESS:
      return Object.assign({}, state, {
        loading: false,
        featureCollection: { "type": "FeatureCollection", "features": action.features }
      });
    default:
      return state;
  }
};

var featuresByCollection = function featuresByCollection() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var action = arguments[1];

  switch (action.type) {
    case _actionTypes.FETCH_FEATURES_INIT:
    case _actionTypes.FETCH_FEATURES_SUCCESS:
    case _actionTypes.FETCH_FEATURES_FAILURE:
      return Object.assign({}, state, _defineProperty({}, action.collection, features(state[action.collection], action)));
    default:
      return state;
  }
};

exports.default = featuresByCollection;