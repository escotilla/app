'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _register = require('../actions/register');

var _updatePayload = require('../actions/update-payload');

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _reactRouterDom = require('react-router-dom');

var _Warning = require('./Warning');

var _Warning2 = _interopRequireDefault(_Warning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var REGISTER = 'register';

var Register = function (_React$Component) {
  _inherits(Register, _React$Component);

  function Register(props) {
    _classCallCheck(this, Register);

    var _this = _possibleConstructorReturn(this, (Register.__proto__ || Object.getPrototypeOf(Register)).call(this, props));

    _this.submit = _this.submit.bind(_this);
    _this.verifiedSubmit = _this.verifiedSubmit.bind(_this);
    _this.renderForm = _this.renderForm.bind(_this);

    _this.state = {
      invalid: []
    };
    return _this;
  }

  _createClass(Register, [{
    key: 'verifiedSubmit',
    value: function verifiedSubmit(email, name, password) {
      this.props.register({
        email: email,
        name: name,
        password: password
      });
    }
  }, {
    key: 'submit',
    value: function submit() {
      var _props$payload = this.props.payload,
          email = _props$payload.email,
          name = _props$payload.name,
          password = _props$payload.password;

      var invalid = [];

      if (!Register.validateEmail(email)) {
        invalid.push('email');
      }

      if (!name || name.length < 2) {
        invalid.push('name');
      }

      if (!password || password.length < 2) {
        invalid.push('password');
      }

      if (invalid.length === 0) {
        this.setState({
          invalid: invalid
        });

        this.verifiedSubmit(email, name, password);
      } else {
        this.setState({
          invalid: invalid
        });
      }
    }
  }, {
    key: 'renderForm',
    value: function renderForm() {
      var _this2 = this;

      var _props = this.props,
          error = _props.error,
          loading = _props.loading,
          loggedIn = _props.loggedIn,
          payload = _props.payload;
      var email = payload.email,
          name = payload.name,
          password = payload.password;


      if (loggedIn) {
        return _react2.default.createElement(_reactRouterDom.Redirect, { to: '/account' });
      }

      var invalid = this.state.invalid;


      var emailClass = invalid.indexOf('email') > -1 ? 'has-error' : '';
      var nameClass = invalid.indexOf('name') > -1 ? 'has-error' : '';
      var passwordClass = invalid.indexOf('password') > -1 ? 'has-error' : '';

      var button = _react2.default.createElement(
        'button',
        {
          disabled: loading,
          id: 'submit',
          onClick: this.submit,
          className: 'button' },
        loading ? _react2.default.createElement('i', { className: 'fa fa-cog fa-spin' }) : 'Create Account'
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
              disabled: loading,
              onChange: function onChange(e) {
                return _this2.props.updatePayload('email', REGISTER, e.target.value);
              },
              value: email,
              type: 'email',
              className: 'form-control form-transparent',
              id: 'email',
              placeholder: 'Email or phone' })
          ),
          _react2.default.createElement(
            'div',
            { className: "form-group " + nameClass },
            _react2.default.createElement('input', {
              onChange: function onChange(e) {
                return _this2.props.updatePayload('name', REGISTER, e.target.value);
              },
              disabled: loading,
              value: name,
              type: 'name',
              className: 'form-control form-transparent',
              id: 'name',
              placeholder: 'Name' })
          ),
          _react2.default.createElement(
            'div',
            { className: "form-group " + passwordClass },
            _react2.default.createElement('input', {
              onChange: function onChange(e) {
                return _this2.props.updatePayload('password', REGISTER, e.target.value);
              },
              disabled: loading,
              value: password,
              type: 'password',
              className: 'form-control form-transparent',
              id: 'password',
              placeholder: 'Password' })
          )
        ),
        button,
        error ? _react2.default.createElement(_Warning2.default, { code: code, message: message }) : null
      );
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { className: 'register-container text-center' },
        _react2.default.createElement(
          'h4',
          null,
          'Sign up for an account.'
        ),
        this.renderForm()
      );
    }
  }], [{
    key: 'validateEmail',
    value: function validateEmail(email) {
      return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
      );
    }
  }]);

  return Register;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      payloadByPage = state.payloadByPage;

  var _ref = payloadByPage[REGISTER] || {
    loading: false,
    error: null,
    payload: {
      name: '',
      email: '',
      password: ''
    }
  },
      loading = _ref.loading,
      error = _ref.error,
      payload = _ref.payload;

  var loggedIn = user && user.token && user.token.length > 0;

  return { loggedIn: loggedIn, loading: loading, error: error, payload: payload };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    updatePayload: (0, _redux.bindActionCreators)(_updatePayload.updatePayload, dispatch),
    register: (0, _redux.bindActionCreators)(_register.register, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Register);