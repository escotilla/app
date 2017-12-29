import {
  BOOT_COMPLETE
} from '../actions/action-types';

const INITIAL_STATE = {
  booting: true
};

const boot = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case BOOT_COMPLETE:
        return Object.assign({}, state, {
          booting: false
        });
      default:
        return state;
    }
  };

export default boot;