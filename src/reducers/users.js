import {
  GET_USERS_INIT,
  GET_USERS_FAILURE,
  GET_USERS_SUCCESS
} from '../actions/action-types';

const INITIAL_STATE = {
  loading: true
};

const users = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case GET_USERS_INIT:
        return Object.assign({}, state, {
          loading: true
        });
      case GET_USERS_FAILURE:
        return Object.assign({}, state, {
          loading: false,
          error: action.error
        });
      case GET_USERS_SUCCESS:
        return Object.assign({}, state, {
          loading: false,
          users: action.users,
          current_page: action.current_page,
          last_page: action.last_page,
        });
      default:
        return state;
    }
  };

export default users;