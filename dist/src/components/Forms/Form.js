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

var _Warning = require('../Warning');

var _Warning2 = _interopRequireDefault(_Warning);

var _Input = require('../Input');

var _Input2 = _interopRequireDefault(_Input);

var _validate = require('validate.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Form = function (_React$Component) {
  _inherits(Form, _React$Component);

  function Form(props) {
    _classCallCheck(this, Form);

    var _this = _possibleConstructorReturn(this, (Form.__proto__ || Object.getPrototypeOf(Form)).call(this, props));

    _this.submit = _this.submit.bind(_this);
    _this.renderForm = _this.renderForm.bind(_this);

    _this.state = {
      validation: {}
    };
    return _this;
  }

  _createClass(Form, [{
    key: 'submit',
    value: function submit() {
      var _props = this.props,
          payload = _props.payload,
          onSubmit = _props.onSubmit,
          formConfig = _props.formConfig;

      var validation = (0, _validate.validate)(payload, formConfig.constraints, { fullMessages: false });

      this.setState({ validation: validation });

      if (validation === undefined) {
        onSubmit(payload);
      }
    }
  }, {
    key: 'renderForm',
    value: function renderForm() {
      var _props2 = this.props,
          error = _props2.error,
          loading = _props2.loading,
          payload = _props2.payload,
          formConfig = _props2.formConfig,
          page = _props2.page,
          buttonText = _props2.buttonText;

      var validation = this.state.validation;

      var button = _react2.default.createElement(
        'button',
        {
          disabled: loading,
          id: 'submit',
          onClick: this.submit,
          className: 'button btn btn-primary' },
        loading ? _react2.default.createElement('i', { className: 'fa fa-cog fa-spin' }) : buttonText
      );

      return _react2.default.createElement(
        'div',
        { className: 'm-2 m-sm-4 m-md-6 mb-10 card' },
        _react2.default.createElement(
          'form',
          null,
          formConfig.questions.map(function (question) {
            return _react2.default.createElement(_Input2.default, {
              loading: loading,
              validation: validation,
              question: question,
              value: payload.hasOwnProperty(question.inputId) ? payload[question.inputId] : '',
              inputId: question.inputId,
              page: page,
              formatter: question.formatter,
              parser: question.parser,
              helper: question.helper,
              type: question.type
            });
          })
        ),
        button,
        error ? _react2.default.createElement(_Warning2.default, { error: error }) : null
      );
    }
  }, {
    key: 'render',
    value: function render() {
      return this.renderForm();
    }
  }]);

  return Form;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state, props) {
  var user = state.user,
      payloadByPage = state.payloadByPage;

  var _ref = payloadByPage[props.page] || {
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

  var loggedIn = user && user.api_token && user.api_token.length > 0;

  return { loggedIn: loggedIn, loading: loading, error: error, payload: payload };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    updatePayload: (0, _redux.bindActionCreators)(_updatePayload.updatePayload, dispatch),
    register: (0, _redux.bindActionCreators)(_register.register, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Form);