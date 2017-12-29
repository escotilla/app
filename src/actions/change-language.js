import {
  CHANGE_LANGUAGE,
} from './action-types';

export function changeLanguage(language) {
  return {
    type: CHANGE_LANGUAGE,
    language: language
  }
}