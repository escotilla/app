import { combineReducers } from 'redux'

import featuresByCollection from './featuresByCollection';
import user from './user';
import payloadByPage from './payloadByPage';
import language from './language';
import boot from './boot';
import application from './application';
import question from './question';

const rootReducer = combineReducers({
  featuresByCollection,
  user,
  payloadByPage,
  language,
  boot,
  application,
  question,
});

export default rootReducer;