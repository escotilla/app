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

  function Input() {
    _classCallCheck(this, Input);

    return _possibleConstructorReturn(this, (Input.__proto__ || Object.getPrototypeOf(Input)).apply(this, arguments));
  }

  _createClass(Input, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          validation = _props.validation,
          loading = _props.loading,
          value = _props.value,
          questions = _props.questions,
          language = _props.language,
          inputId = _props.inputId,
          placeholder = _props.placeholder,
          page = _props.page,
          formatter = _props.formatter,
          parser = _props.parser;


      var hasError = validation && validation.hasOwnProperty(inputId);

      var feedback = hasError ? _react2.default.createElement(
        'div',
        { className: 'invalid-feedback' },
        _language2.default.get(language, validation[inputId][0])
      ) : null;

      return _react2.default.createElement(
        'div',
        { className: "form-group " + (hasError ? 'has-error' : '') },
        _react2.default.createElement(
          'label',
          null,
          questions[inputId][language]
        ),
        _react2.default.createElement('input', {
          required: true,
          disabled: loading,
          onChange: function onChange(e) {
            return _this2.props.updatePayload(inputId, page, parser ? parser(e.target.value) : e.target.value);
          },
          value: formatter ? formatter(value) : value,
          className: 'form-control form-transparent',
          id: inputId,
          placeholder: questions[inputId][language] || placeholder }),
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