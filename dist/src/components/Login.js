'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _login = require('../actions/login');

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _reactRouterDom = require('react-router-dom');

var _Form = require('./Forms/Form');

var _Form2 = _interopRequireDefault(_Form);

var _loginForm = require('../configs/login-form');

var _loginForm2 = _interopRequireDefault(_loginForm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PAGE = 'login';

var Login = function (_React$Component) {
  _inherits(Login, _React$Component);

  function Login() {
    _classCallCheck(this, Login);

    return _possibleConstructorReturn(this, (Login.__proto__ || Object.getPrototypeOf(Login)).apply(this, arguments));
  }

  _createClass(Login, [{
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
          { className: 'register-container text-center pt-5' },
          _react2.default.createElement(
            'h4',
            { className: 'pt-2' },
            'Sign in to your account.'
          ),
          _react2.default.createElement(
            'div',
            { className: 'col-12 col-md-6 offset-md-3 col-lg-4 offset-lg-4' },
            _react2.default.createElement(_Form2.default, {
              onSubmit: this.props.login,
              page: PAGE,
              formConfig: _loginForm2.default,
              buttonText: 'Login'
            })
          )
        )
      );
    }
  }]);

  return Login;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user;


  var loggedIn = user && user.api_token && user.api_token.length > 0;

  return { loggedIn: loggedIn };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    login: (0, _redux.bindActionCreators)(_login.login, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Login);