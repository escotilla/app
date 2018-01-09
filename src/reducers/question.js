import {
  FETCH_QUESTIONS_INIT,
  FETCH_QUESTIONS_SUCCESS,
  FETCH_QUESTIONS_FAILURE
} from '../actions/action-types';

const INITIAL_STATE = {};

const question = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case FETCH_QUESTIONS_INIT:
        return Object.assign({}, state, {
          loading: true
        });
      case FETCH_QUESTIONS_SUCCESS:
        return Object.assign({}, state, {
          loading: false,
          questions: action.questions
        });
      case FETCH_QUESTIONS_FAILURE:
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