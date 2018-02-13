import {
  SET_MENU,
} from './action-types';

export function setMenu(menu) {
  return {
    type: SET_MENU,
    menu: menu
  }
}