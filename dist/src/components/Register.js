'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _register = require('../actions/register');

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _reactRouterDom = require('react-router-dom');

var _Form = require('./Forms/Form');

var _Form2 = _interopRequireDefault(_Form);

var _registerForm = require('../configs/register-form');

var _registerForm2 = _interopRequireDefault(_registerForm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PAGE = 'register';

var Register = function (_React$Component) {
  _inherits(Register, _React$Component);

  function Register() {
    _classCallCheck(this, Register);

    return _possibleConstructorReturn(this, (Register.__proto__ || Object.getPrototypeOf(Register)).apply(this, arguments));
  }

  _createClass(Register, [{
    key: 'render',
    value: function render() {
      var loggedIn = this.props.loggedIn;


      if (loggedIn) {
        return _react2.default.createElement(_reactRouterDom.Redirect, { to: '/account' });
      }

      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'div',
          {
            style: { backgroundImage: "url('/public/images/application-banner.jpg')" },
            className: 'hero-image jumbotron' },
          _react2.default.createElement(
            'div',
            { className: 'text-center hero-text' },
            _react2.default.createElement(
              'h1',
              null,
              'WE HELP YOU TO GROW YOUR DREAM BUSINESS'
            )
          )
        ),
        _react2.default.createElement(
          'div',
          { className: 'register-container text-center' },
          _react2.default.createElement(
            'h4',
            null,
            'Sign up for an account.'
          ),
          _react2.default.createElement(
            'div',
            { className: 'col-12 col-md-6 offset-md-3 col-lg-4 offset-lg-4' },
            _react2.default.createElement(_Form2.default, {
              onSubmit: this.props.register,
              page: PAGE,
              formConfig: _registerForm2.default,
              buttonText: 'Create Account'
            })
          )
        )
      );
    }
  }]);

  return Register;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      payloadByPage = state.payloadByPage;

  var _ref = payloadByPage[PAGE] || {
    loading: false,
    error: null,
    payload: {}
  },
      loading = _ref.loading,
      error = _ref.error,
      payload = _ref.payload;

  var loggedIn = user && user.api_token && user.api_token.length > 0;

  return { loggedIn: loggedIn, loading: loading, error: error, payload: payload };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    register: (0, _redux.bindActionCreators)(_register.register, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Register);