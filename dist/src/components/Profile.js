'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _logout = require('../actions/logout');

var _redux = require('redux');

var _CreateApplication = require('./CreateApplication');

var _CreateApplication2 = _interopRequireDefault(_CreateApplication);

var _ReviewApplication = require('./Forms/ReviewApplication');

var _ReviewApplication2 = _interopRequireDefault(_ReviewApplication);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Profile = function (_React$Component) {
  _inherits(Profile, _React$Component);

  function Profile() {
    _classCallCheck(this, Profile);

    return _possibleConstructorReturn(this, (Profile.__proto__ || Object.getPrototypeOf(Profile)).apply(this, arguments));
  }

  _createClass(Profile, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          user = _props.user,
          question = _props.question,
          language = _props.language;


      var hasApplications = user.applications && user.applications.length > 0;

      return hasApplications ? _react2.default.createElement(
        'div',
        null,
        user.applications.map(function (app) {
          return _react2.default.createElement(
            'div',
            { className: 'container-fluid' },
            _react2.default.createElement(
              'h2',
              null,
              'My Profile'
            ),
            _react2.default.createElement(_ReviewApplication2.default, { applicationId: app.id, answers: app.answers })
          );
        })
      ) : _react2.default.createElement(_CreateApplication2.default, { language: language, questions: question.questions });
    }
  }]);

  return Profile;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      application = state.application,
      question = state.question,
      language = state.language,
      payloadByPage = state.payloadByPage;


  return { user: user, application: application, question: question, language: language, payloadByPage: payloadByPage };
};

var mapStateToDispatch = function mapStateToDispatch(dispatch) {
  return {
    logout: (0, _redux.bindActionCreators)(_logout.logout, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(Profile);