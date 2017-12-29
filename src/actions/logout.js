import lscache from 'ls-cache';
import {
  LOGOUT
} from './action-types';

export function logout() {
  lscache.remove('user');

  return {
    type: LOGOUT
  }
}