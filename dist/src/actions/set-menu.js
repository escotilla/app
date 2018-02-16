'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setMenu = setMenu;

var _actionTypes = require('./action-types');

function setMenu(menu) {
  return {
    type: _actionTypes.SET_MENU,
    menu: menu
  };
}