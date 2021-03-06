import { combineReducers } from 'redux'

import featuresByCollection from './featuresByCollection';
import user from './user';
import users from './users';
import payloadByPage from './payloadByPage';
import language from './language';
import boot from './boot';
import file from './file';
import application from './application';
import question from './question';
import menu from './menu';

const rootReducer = combineReducers({
  featuresByCollection,
  user,
  users,
  payloadByPage,
  language,
  boot,
  application,
  question,
  file,
  menu,
});

export default rootReducer;