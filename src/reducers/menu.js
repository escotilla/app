import {
  SET_MENU,
} from '../actions/action-types';

const INITIAL_STATE = 'closed';

const language = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case SET_MENU:
        return action.menu;
      default:
        return state;
    }
  };

export default language;