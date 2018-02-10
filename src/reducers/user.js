import {
  REGISTER_SUCCESS,
  LOAD_USER,
  LOGIN_SUCCESS,
  LOGOUT,
  CREATE_APPLICATION_SUCCESS,
  UPDATE_APPLICATION_SUCCESS,
} from '../actions/action-types';

const INITIAL_STATE = {};

const user = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case REGISTER_SUCCESS:
      case LOGIN_SUCCESS:
      case LOAD_USER:
      case CREATE_APPLICATION_SUCCESS:
      case UPDATE_APPLICATION_SUCCESS:
        return Object.assign({}, state, action.user);
      case LOGOUT:
        return INITIAL_STATE;
      default:
        return state;
    }
  };

export default user;