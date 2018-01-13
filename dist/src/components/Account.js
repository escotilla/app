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

var _questions = require('../configs/questions');

var _questions2 = _interopRequireDefault(_questions);

var _reactRouterDom = require('react-router-dom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Account = function (_React$Component) {
  _inherits(Account, _React$Component);

  function Account() {
    _classCallCheck(this, Account);

    return _possibleConstructorReturn(this, (Account.__proto__ || Object.getPrototypeOf(Account)).apply(this, arguments));
  }

  _createClass(Account, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          application = _props.application,
          question = _props.question,
          language = _props.language;


      var applications = application.applications ? application.applications : [];

      if (application.loading) {
        return _react2.default.createElement(
          'div',
          null,
          'loadng...'
        );
      }

      return _react2.default.createElement(
        'div',
        { className: 'row' },
        _react2.default.createElement(
          'div',
          { className: 'col-xs-12 col-md-3 col-lg-2 side-bar' },
          _react2.default.createElement(
            'ul',
            null,
            _react2.default.createElement(
              'li',
              null,
              _react2.default.createElement(
                _reactRouterDom.NavLink,
                {
                  to: '/account/upload-documents',
                  activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
                'Upload Documents'
              )
            ),
            _react2.default.createElement(
              'li',
              null,
              _react2.default.createElement(
                _reactRouterDom.NavLink,
                {
                  to: '/account/loan-contract',
                  activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
                'Loan Contract'
              )
            )
          )
        ),
        _react2.default.createElement(
          'div',
          { className: 'col-xs-12 col-md-9 col-lg-10' },
          application.applications && application.applications.length > 0 ? applications.map(function (app) {
            return _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(
                'h1',
                null,
                'Loan application for: $',
                app.answers[_questions2.default.LOAN_AMOUNT]
              ),
              _react2.default.createElement(
                'ul',
                null,
                app.checklist.map(function (item) {
                  return _react2.default.createElement(
                    'li',
                    null,
                    item.title + ': ' + item.status
                  );
                })
              )
            );
          }) : _react2.default.createElement(_CreateApplication2.default, {
            language: language,
            questions: question.questions })
        )
      );
    }
  }]);

  return Account;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      application = state.application,
      question = state.question,
      language = state.language;


  return { user: user, application: application, question: question, language: language };
};

var mapStateToDispatch = function mapStateToDispatch(dispatch) {
  return {
    logout: (0, _redux.bindActionCreators)(_logout.logout, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(Account);