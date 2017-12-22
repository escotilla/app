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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Register = function (_React$Component) {
  _inherits(Register, _React$Component);

  function Register(props) {
    _classCallCheck(this, Register);

    var _this = _possibleConstructorReturn(this, (Register.__proto__ || Object.getPrototypeOf(Register)).call(this, props));

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

  _createClass(Register, [{
    key: 'verifiedSubmit',
    value: function verifiedSubmit() {
      var _props$payload = this.props.payload,
          email = _props$payload.email,
          name = _props$payload.name,
          password = _props$payload.password;


      this.props.register({
        email: email,
        name: name,
        password: password
      });
    }
  }, {
    key: 'submit',
    value: function submit() {
      var _props$payload2 = this.props.payload,
          email = _props$payload2.email,
          name = _props$payload2.name,
          password = _props$payload2.password;

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
      var nameClass = invalid.indexOf('name') > -1 ? 'has-error' : '';
      var passwordClass = invalid.indexOf('password') > -1 ? 'has-error' : '';

      var button = _react2.default.createElement(
        'button',
        {
          disabled: success || loading || error,
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
            { className: "form-group " + nameClass },
            _react2.default.createElement('input', {
              onChange: function onChange(e) {
                return _this2.props.updatePayload('name', e.target.value);
              },
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
        { className: 'register-container text-center' },
        _react2.default.createElement(
          'h4',
          null,
          'Sign up for an account.'
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

  return Register;
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
    register: (0, _redux.bindActionCreators)(_register.register, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Register);