import { combineReducers } from 'redux'

import featuresByCollection from './featuresByCollection';
import user from './user';
import payloadByPage from './payload';
import language from './language';
import boot from './boot';

const rootReducer = combineReducers({
  featuresByCollection,
  user,
  payloadByPage,
  language,
  boot
});

export default rootReducer;