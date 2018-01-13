import {
  DOWNLOAD_INIT,
  DOWNLOAD_SUCCESS,
  DOWNLOAD_FAILURE
} from '../actions/action-types';

const INITIAL_STATE = {};

const question = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case DOWNLOAD_INIT:
        return Object.assign({}, state, {
          loading: true
        });
      case DOWNLOAD_SUCCESS:
        return Object.assign({}, state, {
          loading: false
        });
      case DOWNLOAD_FAILURE:
        return Object.assign({}, state, {
          loading: false,
          error: {
            message: action.error.message || undefined,
            code: action.error.code || 500
          }
        });
      default:
        return state;
    }
  };

export default question;