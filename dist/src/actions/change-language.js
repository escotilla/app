'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.changeLanguage = changeLanguage;

var _actionTypes = require('./action-types');

function changeLanguage(language) {
  return {
    type: _actionTypes.CHANGE_LANGUAGE,
    language: language
  };
}