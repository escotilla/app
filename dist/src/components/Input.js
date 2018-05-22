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

var _language = require('../utilities/language');

var _language2 = _interopRequireDefault(_language);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Input = function (_React$Component) {
  _inherits(Input, _React$Component);

  function Input(props) {
    _classCallCheck(this, Input);

    var _this = _possibleConstructorReturn(this, (Input.__proto__ || Object.getPrototypeOf(Input)).call(this, props));

    _this.updatePayload = _this.updatePayload.bind(_this);
    return _this;
  }

  _createClass(Input, [{
    key: 'updatePayload',
    value: function updatePayload(e) {
      var _props = this.props,
          page = _props.page,
          question = _props.question;
      var inputId = question.inputId,
          parser = question.parser;


      this.props.updatePayload(inputId, page, parser ? parser(e.target.value) : e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    }
  }, {
    key: 'render',
    value: function render() {
      var _props2 = this.props,
          validation = _props2.validation,
          loading = _props2.loading,
          value = _props2.value,
          language = _props2.language,
          placeholder = _props2.placeholder,
          question = _props2.question,
          helper = _props2.helper,
          questions = _props2.questions;


      var formLabel = this.props.label;

      var inputId = question.inputId,
          formatter = question.formatter,
          type = question.type,
          disabled = question.disabled;

      var hasError = validation && validation.hasOwnProperty(inputId);

      var feedback = hasError ? _react2.default.createElement(
        'div',
        { style: { color: 'red' }, className: 'helper invalid-feedback' },
        _language2.default.get(language, validation[inputId][0])
      ) : _react2.default.createElement(
        'div',
        { className: 'helper' },
        helper !== undefined ? helper : _language2.default.get(language, inputId + '.helper')
      );

      return _react2.default.createElement(
        'div',
        { className: "form-group " + (hasError ? 'has-error' : '') },
        _react2.default.createElement(
          'label',
          { className: 'form-label' },
          _language2.default.get(language, inputId + '.label') || formLabel
        ),
        _react2.default.createElement('input', {
          required: true,
          disabled: loading || disabled,
          onChange: this.updatePayload,
          value: formatter ? formatter(value) : value,
          checked: type === 'checkbox' ? value : null,
          className: type === 'checkbox' ? "" : "form-input form-transparent",
          id: inputId,
          type: type || 'text',
          placeholder: _language2.default.get(language, inputId + '.placeholder') || placeholder }),
        feedback
      );
    }
  }]);

  return Input;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var language = state.language,
      question = state.question;


  var questions = question.questions || [];

  return { language: language, questions: questions };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    updatePayload: (0, _redux.bindActionCreators)(_updatePayload.updatePayload, dispatch),
    createApplicationWithAuth: (0, _redux.bindActionCreators)(_createApplication.createApplicationWithAuth, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Input);