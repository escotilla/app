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

var _LoanContractForm = require('./Forms/LoanContractForm');

var _LoanContractForm2 = _interopRequireDefault(_LoanContractForm);

var _questions = require('../configs/questions');

var _questions2 = _interopRequireDefault(_questions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LoanContract = function (_React$Component) {
  _inherits(LoanContract, _React$Component);

  function LoanContract() {
    _classCallCheck(this, LoanContract);

    return _possibleConstructorReturn(this, (LoanContract.__proto__ || Object.getPrototypeOf(LoanContract)).apply(this, arguments));
  }

  _createClass(LoanContract, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      var user = this.props.user;


      return _react2.default.createElement(
        'div',
        null,
        user.applications.map(function (app) {
          return app.answers[_questions2.default.AGREE_LOAN_CONTRACT] ? _react2.default.createElement(
            'h2',
            null,
            'thanks'
          ) : _react2.default.createElement(
            'div',
            null,
            _react2.default.createElement(
              'h1',
              null,
              'Please accept our contract'
            ),
            _react2.default.createElement(_LoanContractForm2.default, {
              answers: app.answers,
              applicationId: app.id }),
            _react2.default.createElement(
              'h3',
              { onClick: function onClick() {
                  return _this2.props.logout();
                } },
              ' LOGOUT '
            )
          );
        })
      );
    }
  }]);

  return LoanContract;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user;


  return { user: user };
};

var mapStateToDispatch = function mapStateToDispatch(dispatch) {
  return {
    logout: (0, _redux.bindActionCreators)(_logout.logout, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(LoanContract);