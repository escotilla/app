'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.changeLanguage = changeLanguage;

var _actionTypes = require('./action-types');

var _lsCache = require('ls-cache');

var _lsCache2 = _interopRequireDefault(_lsCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function changeLanguage(language) {
  _lsCache2.default.set('language', language);

  return {
    type: _actionTypes.CHANGE_LANGUAGE,
    language: language
  };
}