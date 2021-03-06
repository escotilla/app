'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _register = require('../../actions/register');

var _updatePayload = require('../../actions/update-payload');

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _registerForm = require('../../configs/register-form');

var _registerForm2 = _interopRequireDefault(_registerForm);

var _Form = require('./Form');

var _Form2 = _interopRequireDefault(_Form);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PAGE = 'register';

var RegisterForm = function (_React$Component) {
  _inherits(RegisterForm, _React$Component);

  function RegisterForm() {
    _classCallCheck(this, RegisterForm);

    return _possibleConstructorReturn(this, (RegisterForm.__proto__ || Object.getPrototypeOf(RegisterForm)).apply(this, arguments));
  }

  _createClass(RegisterForm, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(_Form2.default, {
        onSubmit: _register.register,
        page: PAGE,
        formConfig: _registerForm2.default,
        buttonText: 'Create Account'
      });
    }
  }]);

  return RegisterForm;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    updatePayload: (0, _redux.bindActionCreators)(_updatePayload.updatePayload, dispatch),
    register: (0, _redux.bindActionCreators)(_register.register, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(RegisterForm);