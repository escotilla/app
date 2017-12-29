'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _language = require('../configs/language');

var _language2 = _interopRequireDefault(_language);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Language = function () {
  function Language() {
    _classCallCheck(this, Language);
  }

  _createClass(Language, null, [{
    key: 'resolve',
    value: function resolve(path, obj) {
      return path.split('.').reduce(function (prev, current) {
        return prev ? prev[current] : undefined;
      }, obj);
    }
  }, {
    key: 'get',
    value: function get(language, path) {
      var fullPath = language + '.' + path;
      return Language.resolve(fullPath, _language2.default);
    }
  }]);

  return Language;
}();

exports.default = Language;