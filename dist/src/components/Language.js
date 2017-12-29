'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _language = require('../configs/language');

var _language2 = _interopRequireDefault(_language);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Language = function (_React$Component) {
  _inherits(Language, _React$Component);

  function Language() {
    _classCallCheck(this, Language);

    return _possibleConstructorReturn(this, (Language.__proto__ || Object.getPrototypeOf(Language)).apply(this, arguments));
  }

  _createClass(Language, [{
    key: 'resolve',
    value: function resolve(path, obj) {
      return path.split('.').reduce(function (prev, current) {
        return prev ? prev[current] : undefined;
      }, obj);
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          language = _props.language,
          path = _props.path;

      var fullPath = language + '.' + path;

      return this.resolve(fullPath, _language2.default);
    }
  }]);

  return Language;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var _ref = state || 'spanish',
      language = _ref.language;

  return { language: language };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps)(Language);