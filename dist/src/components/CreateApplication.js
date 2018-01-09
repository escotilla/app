'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createApplication = require('../actions/create-application');

var _updatePayload = require('../actions/update-payload');

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _reactRouterDom = require('react-router-dom');

var _Warning = require('./Warning');

var _Warning2 = _interopRequireDefault(_Warning);

var _questions = require('../configs/questions');

var _questions2 = _interopRequireDefault(_questions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PAGE = 'create-application';

var CreateApplication = function (_React$Component) {
  _inherits(CreateApplication, _React$Component);

  function CreateApplication(props) {
    _classCallCheck(this, CreateApplication);

    var _this = _possibleConstructorReturn(this, (CreateApplication.__proto__ || Object.getPrototypeOf(CreateApplication)).call(this, props));

    _this.submit = _this.submit.bind(_this);
    _this.renderForm = _this.renderForm.bind(_this);

    _this.state = {
      invalid: []
    };
    return _this;
  }

  _createClass(CreateApplication, [{
    key: 'submit',
    value: function submit() {
      this.props.createApplicationWithAuth(this.props.payload);
    }
  }, {
    key: 'renderForm',
    value: function renderForm() {
      var _this2 = this;

      var _props = this.props,
          error = _props.error,
          loading = _props.loading,
          payload = _props.payload,
          questions = _props.questions,
          language = _props.language;


      var button = _react2.default.createElement(
        'button',
        {
          disabled: loading,
          id: 'submit',
          onClick: this.submit,
          className: 'button' },
        loading ? _react2.default.createElement('i', { className: 'fa fa-cog fa-spin' }) : 'Create Application'
      );

      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'form',
          null,
          _react2.default.createElement(
            'div',
            { className: "form-group " },
            _react2.default.createElement(
              'label',
              null,
              questions[_questions2.default.LOAN_AMOUNT][language]
            ),
            _react2.default.createElement('input', {
              disabled: loading,
              onChange: function onChange(e) {
                return _this2.props.updatePayload(_questions2.default.LOAN_AMOUNT, PAGE, e.target.value);
              },
              value: payload[_questions2.default.LOAN_AMOUNT],
              className: 'form-control form-transparent',
              id: _questions2.default.LOAN_AMOUNT,
              placeholder: 200 })
          ),
          _react2.default.createElement(
            'div',
            { className: "form-group " },
            _react2.default.createElement(
              'label',
              null,
              questions[_questions2.default.BUSINESS_NAME][language]
            ),
            _react2.default.createElement('input', {
              disabled: loading,
              onChange: function onChange(e) {
                return _this2.props.updatePayload(_questions2.default.BUSINESS_NAME, PAGE, e.target.value);
              },
              value: payload[_questions2.default.BUSINESS_NAME],
              className: 'form-control form-transparent',
              id: _questions2.default.BUSINESS_NAME,
              placeholder: questions[_questions2.default.BUSINESS_NAME][language] })
          ),
          _react2.default.createElement(
            'div',
            { className: "form-group " },
            _react2.default.createElement(
              'label',
              null,
              questions[_questions2.default.BUSINESS_DESCRIPTION][language]
            ),
            _react2.default.createElement('input', {
              onChange: function onChange(e) {
                return _this2.props.updatePayload(_questions2.default.BUSINESS_DESCRIPTION, PAGE, e.target.value);
              },
              disabled: loading,
              value: payload[_questions2.default.BUSINESS_DESCRIPTION],
              type: 'name',
              className: 'form-control form-transparent',
              id: _questions2.default.BUSINESS_DESCRIPTION,
              placeholder: questions[_questions2.default.BUSINESS_DESCRIPTION][language] })
          ),
          _react2.default.createElement(
            'div',
            { className: "form-group " },
            _react2.default.createElement(
              'label',
              null,
              questions[_questions2.default.BUSINESS_PRODUCT][language]
            ),
            _react2.default.createElement('input', {
              onChange: function onChange(e) {
                return _this2.props.updatePayload(_questions2.default.BUSINESS_PRODUCT, PAGE, e.target.value);
              },
              disabled: loading,
              value: payload[_questions2.default.BUSINESS_PRODUCT],
              className: 'form-control form-transparent',
              id: _questions2.default.BUSINESS_PRODUCT,
              placeholder: questions[_questions2.default.BUSINESS_PRODUCT][language] })
          )
        ),
        button,
        error ? _react2.default.createElement(_Warning2.default, { error: error }) : null
      );
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        null,
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

  return CreateApplication;
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

  var loggedIn = user && user.token && user.token.length > 0;

  return { loggedIn: loggedIn, loading: loading, error: error, payload: payload };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    updatePayload: (0, _redux.bindActionCreators)(_updatePayload.updatePayload, dispatch),
    createApplicationWithAuth: (0, _redux.bindActionCreators)(_createApplication.createApplicationWithAuth, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(CreateApplication);