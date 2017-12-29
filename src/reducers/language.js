import {
  CHANGE_LANGUAGE,
} from '../actions/action-types';

const INITIAL_STATE = 'english';

const language = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case CHANGE_LANGUAGE:
        return action.language;
      default:
        return state;
    }
  };

export default language;