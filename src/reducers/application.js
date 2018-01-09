import {
  GET_APPLICATIONS_INIT,
  GET_APPLICATIONS_FAILURE,
  GET_APPLICATIONS_SUCCESS,
  CREATE_APPLICATION_INIT,
  CREATE_APPLICATION_FAILURE,
  CREATE_APPLICATION_SUCCESS,
  LOGOUT
} from '../actions/action-types';

const INITIAL_STATE = {};

const application = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case GET_APPLICATIONS_INIT:
    case CREATE_APPLICATION_INIT:
      return Object.assign({}, state, {
        loading: true
      });
    case GET_APPLICATIONS_SUCCESS:
    case CREATE_APPLICATION_SUCCESS:
      return Object.assign({}, state, {
        loading: false,
        applications: action.applications,
        error: null,
        success: true
      });
    case GET_APPLICATIONS_FAILURE:
    case CREATE_APPLICATION_FAILURE:
      return Object.assign({}, state, {
        loading: false,
        error: {
          message: action.error.message || undefined,
          code: action.error.code || 500
        }
      });
    case LOGOUT:
      return INITIAL_STATE;
    default:
      return state;
  }
};

export default application;