'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _updateApplication = require('../actions/update-application');

var _updatePayload = require('../actions/update-payload');

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _reactRouterDom = require('react-router-dom');

var _Warning = require('./Warning');

var _Warning2 = _interopRequireDefault(_Warning);

var _questions = require('../configs/questions');

var _questions2 = _interopRequireDefault(_questions);

var _reviewApplicationForm = require('../configs/review-application-form');

var _reviewApplicationForm2 = _interopRequireDefault(_reviewApplicationForm);

var _validate = require('validate.js');

var _Input = require('./Input');

var _Input2 = _interopRequireDefault(_Input);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PAGE = 'review-application';

var ReviewApplication = function (_React$Component) {
  _inherits(ReviewApplication, _React$Component);

  function ReviewApplication(props) {
    _classCallCheck(this, ReviewApplication);

    var _this = _possibleConstructorReturn(this, (ReviewApplication.__proto__ || Object.getPrototypeOf(ReviewApplication)).call(this, props));

    _this.submit = _this.submit.bind(_this);
    _this.renderForm = _this.renderForm.bind(_this);

    _this.state = {
      invalid: [],
      validation: {}
    };
    return _this;
  }

  _createClass(ReviewApplication, [{
    key: 'submit',
    value: function submit() {
      var _props = this.props,
          payload = _props.payload,
          applicationId = _props.applicationId,
          updateApplicationWithAuth = _props.updateApplicationWithAuth;

      var validation = (0, _validate.validate)(payload, _reviewApplicationForm2.default.constraints, { fullMessages: false });

      this.setState({ validation: validation });

      if (validation === undefined) {
        updateApplicationWithAuth(payload, applicationId);
      }
    }

    // componentWillMount() {
    //   const {payload, answers} = this.props;
    //
    //   for (let id in answers) {
    //     if (answers.hasOwnProperty(id) && !payload.hasOwnProperty(id)) {
    //       this.props.updatePayload(id, PAGE, answers[id]);
    //     }
    //   }
    // }

  }, {
    key: 'renderForm',
    value: function renderForm() {
      var _props2 = this.props,
          error = _props2.error,
          loading = _props2.loading,
          payload = _props2.payload,
          answers = _props2.answers;

      var validation = this.state.validation;

      var button = _react2.default.createElement(
        'button',
        {
          disabled: loading || Object.keys(payload).length === 0,
          id: 'submit',
          onClick: this.submit,
          className: 'button' },
        loading ? _react2.default.createElement('i', { className: 'fa fa-cog fa-spin' }) : 'Update'
      );

      console.log(this);
      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'form',
          null,
          _reviewApplicationForm2.default.questions.map(function (question) {
            return _react2.default.createElement(_Input2.default, {
              loading: loading,
              validation: validation,
              value: payload.hasOwnProperty(question.inputId) ? payload[question.inputId] : answers[question.inputId],
              inputId: question.inputId,
              page: PAGE,
              formatter: question.formatter,
              parser: question.parser
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
      return _react2.default.createElement(
        'div',
        null,
        this.renderForm()
      );
    }
  }]);

  return ReviewApplication;
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
    updatePayload: (0, _redux.bindActionCreators)(_updatePayload.updatePayload, dispatch),
    updateApplicationWithAuth: (0, _redux.bindActionCreators)(_updateApplication.updateApplicationWithAuth, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ReviewApplication);