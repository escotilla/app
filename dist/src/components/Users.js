'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _getUsers = require('../actions/get-users');

var _redux = require('redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Users = function (_React$Component) {
  _inherits(Users, _React$Component);

  function Users() {
    _classCallCheck(this, Users);

    return _possibleConstructorReturn(this, (Users.__proto__ || Object.getPrototypeOf(Users)).apply(this, arguments));
  }

  _createClass(Users, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.props.getUsersIfAdmin();
    }
  }, {
    key: 'render',
    value: function render() {
      var users = this.props.users;
      var current_page = users.current_page,
          last_page = users.last_page,
          loading = users.loading;


      if (loading) {
        return _react2.default.createElement(
          'h1',
          null,
          'LOADING...'
        );
      }

      var current = users.users;
      console.log(this);
      return _react2.default.createElement(
        'div',
        null,
        current.map(function (user) {
          return _react2.default.createElement(
            'div',
            null,
            _react2.default.createElement(
              'h4',
              null,
              user.name
            ),
            _react2.default.createElement(
              'p',
              null,
              user.email
            )
          );
        })
      );
    }
  }]);

  return Users;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var users = state.users,
      application = state.application,
      question = state.question,
      language = state.language,
      payloadByPage = state.payloadByPage;


  return { users: users, application: application, question: question, language: language, payloadByPage: payloadByPage };
};

var mapStateToDispatch = function mapStateToDispatch(dispatch) {
  return {
    getUsersIfAdmin: (0, _redux.bindActionCreators)(_getUsers.getUsersIfAdmin, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(Users);