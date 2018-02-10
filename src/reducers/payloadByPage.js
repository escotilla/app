import {
  UPDATE_PAYLOAD,
  REGISTER_SUCCESS,
  LOGIN_SUCCESS,
  REGISTER_FAILURE,
  LOGIN_FAILURE,
  LOGIN_INIT,
  REGISTER_INIT,
  CLEAR_PAYLOAD,
  LOGOUT,
} from '../actions/action-types';

const INITIAL_STATE = {};

const payload = (state = {
  payload: {},
  loading: false,
  error: null,
  message: null,
  success: null
}, action) => {
    switch (action.type) {
      case UPDATE_PAYLOAD:
        return Object.assign({}, state, {
          payload: updatePayload(state.payload, action)
        });
      case LOGIN_INIT:
      case REGISTER_INIT:
        return Object.assign({}, state, {
          loading: true
        });
      case REGISTER_SUCCESS:
      case LOGIN_SUCCESS:
        return Object.assign({}, state, {
          payload: INITIAL_STATE,
          loading: false,
          success: true,
          error: null
        });
      case REGISTER_FAILURE:
      case LOGIN_FAILURE:
        return Object.assign({}, state, {
          loading: false,
          error: {
            message: action.error.message || undefined,
            code: action.error.code || 500
          }
        });
      case CLEAR_PAYLOAD:
        return Object.assign({}, state, {
          payload: {}
        });
      default:
        return state;
    }
  };

const updatePayload = (state, action) => {
  switch (action.type) {
    case UPDATE_PAYLOAD:
      return Object.assign({}, state, {
        [action.id]: action.text
      });
    default:
      return state;
  }
};

const payloadByPage = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_PAYLOAD:
    case REGISTER_FAILURE:
    case REGISTER_SUCCESS:
    case REGISTER_INIT:
    case LOGIN_SUCCESS:
    case LOGIN_FAILURE:
    case LOGIN_INIT:
    case CLEAR_PAYLOAD:
      return Object.assign({}, state, {
        [action.page]: payload(state[action.page], action)
      });
    case LOGOUT:
      return {};
    default:
      return state
  }
};

export default payloadByPage;