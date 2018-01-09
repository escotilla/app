import {
  REGISTER_SUCCESS,
  LOAD_USER,
  LOGIN_SUCCESS,
  LOGOUT,
} from '../actions/action-types';

const INITIAL_STATE = {};

const user = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case REGISTER_SUCCESS:
      case LOGIN_SUCCESS:
      case LOAD_USER:
        return Object.assign({}, state, {
          token: action.token,
          email: action.email,
          application_ids: action.application_ids
        });
      case LOGOUT:
        return INITIAL_STATE;
      default:
        return state;
    }
  };

export default user;