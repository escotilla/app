import {
  CHANGE_LANGUAGE,
} from './action-types';
import lscache from 'ls-cache';

export function changeLanguage(language) {
  lscache.set('language', language);

  return {
    type: CHANGE_LANGUAGE,
    language: language
  }
}