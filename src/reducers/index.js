import { combineReducers } from 'redux'

import featuresByCollection from './featuresByCollection';
import user from './user';
import payload from './payload';

const rootReducer = combineReducers({
  featuresByCollection,
  user,
  payload
});

export default rootReducer;