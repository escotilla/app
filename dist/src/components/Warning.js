'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _login = require('../actions/login');

var _updatePayload = require('../actions/update-payload');

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _reactRouterDom = require('react-router-dom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Warning = function (_React$Component) {
  _inherits(Warning, _React$Component);

  function Warning() {
    _classCallCheck(this, Warning);

    return _possibleConstructorReturn(this, (Warning.__proto__ || Object.getPrototypeOf(Warning)).apply(this, arguments));
  }

  _createClass(Warning, [{
    key: 'render',
    value: function render() {
      var _props$error = this.props.error,
          code = _props$error.code,
          message = _props$error.message;


      if (code && message) {
        return _react2.default.createElement(
          'div',
          null,
          _react2.default.createElement(
            'div',
            { className: 'alert alert-warning', role: 'alert' },
            message
          )
        );
      } else {
        return _react2.default.createElement(
          'div',
          null,
          _react2.default.createElement(
            'div',
            { className: 'alert alert-danger', role: 'alert' },
            'Critical Error!'
          )
        );
      }
    }
  }]);

  return Warning;
}(_react2.default.Component);

exports.default = Warning;