import {
  UPDATE_PAYLOAD,
  REGISTER_SUCCESS,
  REGISTER_FAILURE
} from '../actions/action-types';

const INITIAL_STATE = {
  email: '',
  name: '',
  password: ''
};

const payload = (state = {payload: INITIAL_STATE}, action) => {
    switch (action.type) {
      case UPDATE_PAYLOAD:
        return Object.assign({}, state, {
          [action.id]: action.text
        });
      case REGISTER_SUCCESS:
      case REGISTER_FAILURE:
        return {};
      default:
        return state;
    }
  };

export default payload;