import {
  REGISTER_FAILURE,
  REGISTER_INIT,
  REGISTER_SUCCESS,
  LOGIN_FAILURE,
  LOGIN_INIT,
  LOGIN_SUCCESS,
  LOGOUT,
} from '../actions/action-types';

const INITIAL_STATE = {
  loading: false
};

const user = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case REGISTER_INIT:
      case LOGIN_INIT:
        return Object.assign({}, state, {
          loading: true
        });
      case REGISTER_SUCCESS:
      case LOGIN_SUCCESS:
        return Object.assign({}, state, {
          loading: false,
          success: true,
          token: action.token,
          email: action.email
        });
      case REGISTER_FAILURE:
      case LOGIN_FAILURE:
        return Object.assign({}, state, {
          loading: false,
          error: action.error
        });
      case LOGOUT:
        return INITIAL_STATE;
      default:
        return state;
    }
  };

export default user;