'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createApplication = require('../../actions/create-application');

var _updatePayload = require('../../actions/update-payload');

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _createApplicationForm = require('../../configs/create-application-form');

var _createApplicationForm2 = _interopRequireDefault(_createApplicationForm);

var _Form = require('./Form');

var _Form2 = _interopRequireDefault(_Form);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PAGE = 'create-application';

var CreateApplicationForm = function (_React$Component) {
  _inherits(CreateApplicationForm, _React$Component);

  function CreateApplicationForm(props) {
    _classCallCheck(this, CreateApplicationForm);

    var _this = _possibleConstructorReturn(this, (CreateApplicationForm.__proto__ || Object.getPrototypeOf(CreateApplicationForm)).call(this, props));

    _this.renderForm = _this.renderForm.bind(_this);

    _this.state = {
      validation: {}
    };
    return _this;
  }

  _createClass(CreateApplicationForm, [{
    key: 'renderForm',
    value: function renderForm() {
      return _react2.default.createElement(_Form2.default, {
        onSubmit: this.props.createApplicationWithAuth,
        page: PAGE,
        formConfig: _createApplicationForm2.default,
        buttonText: 'Create Application'
      });
    }
  }, {
    key: 'render',
    value: function render() {
      return this.renderForm();
    }
  }]);

  return CreateApplicationForm;
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
    createApplicationWithAuth: (0, _redux.bindActionCreators)(_createApplication.createApplicationWithAuth, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(CreateApplicationForm);