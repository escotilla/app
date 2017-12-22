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

var Login = function (_React$Component) {
  _inherits(Login, _React$Component);

  function Login(props) {
    _classCallCheck(this, Login);

    var _this = _possibleConstructorReturn(this, (Login.__proto__ || Object.getPrototypeOf(Login)).call(this, props));

    _this.submit = _this.submit.bind(_this);
    _this.verifiedSubmit = _this.verifiedSubmit.bind(_this);
    _this.getMessageBox = _this.getMessageBox.bind(_this);

    _this.state = {
      submitted: false,
      email: '',
      name: '',
      password: '',
      invalid: []
    };
    return _this;
  }

  _createClass(Login, [{
    key: 'verifiedSubmit',
    value: function verifiedSubmit() {
      var _props$payload = this.props.payload,
          email = _props$payload.email,
          password = _props$payload.password;


      this.props.login({
        email: email,
        password: password
      });
    }
  }, {
    key: 'submit',
    value: function submit() {
      var _props$payload2 = this.props.payload,
          email = _props$payload2.email,
          password = _props$payload2.password;

      var invalid = [];

      if (!Login.validateEmail(email)) {
        invalid.push('email');
      }

      if (password.length < 2) {
        invalid.push('password');
      }

      if (invalid.length === 0) {
        this.setState({
          submitted: true,
          invalid: invalid
        });

        this.verifiedSubmit();
      } else {
        this.setState({
          invalid: invalid
        });
      }
    }
  }, {
    key: 'getMessageBox',
    value: function getMessageBox() {
      var _this2 = this;

      var _props = this.props,
          error = _props.error,
          payload = _props.payload,
          loading = _props.loading,
          success = _props.success,
          email = _props.email,
          name = _props.name,
          password = _props.password,
          user = _props.user;


      if (success && user.token) {
        return _react2.default.createElement(_reactRouterDom.Redirect, { to: '/account' });
      }

      var invalid = this.state.invalid;


      var emailClass = invalid.indexOf('email') > -1 ? 'has-error' : '';
      var passwordClass = invalid.indexOf('password') > -1 ? 'has-error' : '';

      var button = _react2.default.createElement(
        'button',
        {
          disabled: success || loading || error,
          id: 'submit',
          onClick: this.submit,
          className: 'button' },
        loading ? _react2.default.createElement('i', { className: 'fa fa-cog fa-spin' }) : 'Send Message'
      );

      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'form',
          null,
          _react2.default.createElement(
            'div',
            { className: "form-group " + emailClass },
            _react2.default.createElement('input', {
              onChange: function onChange(e) {
                return _this2.props.updatePayload('email', e.target.value);
              },
              value: email,
              type: 'email',
              className: 'form-control form-transparent',
              id: 'email',
              placeholder: 'Email or phone' })
          ),
          _react2.default.createElement(
            'div',
            { className: "form-group " + passwordClass },
            _react2.default.createElement('input', {
              onChange: function onChange(e) {
                return _this2.props.updatePayload('password', e.target.value);
              },
              value: password,
              type: 'password',
              className: 'form-control form-transparent',
              id: 'password',
              placeholder: 'Password' })
          )
        ),
        button
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var passwordBox = this.getMessageBox();

      return _react2.default.createElement(
        'div',
        { className: 'login-container text-center' },
        _react2.default.createElement(
          'h4',
          null,
          'Login'
        ),
        passwordBox
      );
    }
  }], [{
    key: 'validateEmail',
    value: function validateEmail(email) {
      return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
      );
    }
  }]);

  return Login;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      payload = state.payload;

  var _ref = payload || {
    name: '',
    email: '',
    password: ''
  },
      name = _ref.name,
      email = _ref.email,
      password = _ref.password;

  var _ref2 = user || {
    loading: false,
    error: null,
    success: false
  },
      loading = _ref2.loading,
      error = _ref2.error,
      success = _ref2.success;

  return { user: user, payload: payload, loading: loading, error: error, success: success, name: name, email: email, password: password };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    updatePayload: (0, _redux.bindActionCreators)(_updatePayload.updatePayload, dispatch),
    login: (0, _redux.bindActionCreators)(_login.login, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Login);