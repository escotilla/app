'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouterDom = require('react-router-dom');

var _reactRedux = require('react-redux');

var _logout = require('../actions/logout');

var _changeLanguage = require('../actions/change-language');

var _redux = require('redux');

var _Hamburger = require('./Hamburger');

var _Hamburger2 = _interopRequireDefault(_Hamburger);

var _reactRouter = require('react-router');

var _setMenu = require('../actions/set-menu');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Nav = function (_React$Component) {
  _inherits(Nav, _React$Component);

  function Nav(props) {
    _classCallCheck(this, Nav);

    return _possibleConstructorReturn(this, (Nav.__proto__ || Object.getPrototypeOf(Nav)).call(this, props));
  }

  _createClass(Nav, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          routes = _props.routes,
          location = _props.location;


      return _react2.default.createElement(
        'nav',
        { className: 'navbar justify-content-between flex-row escotilla-navbar' },
        _react2.default.createElement(
          'div',
          {
            onClick: function onClick() {
              return _this2.props.setMenu('closed');
            },
            className: 'flex-row' },
          _react2.default.createElement(
            _reactRouterDom.NavLink,
            { className: 'brand-logo', to: '/' },
            _react2.default.createElement('div', {
              className: 'flex-row logo',
              style: { backgroundImage: 'url("/public/images/logo.png")' } })
          )
        ),
        _react2.default.createElement(_Hamburger2.default, {
          location: location,
          routes: routes })
      );
    }
  }]);

  return Nav;
}(_react2.default.Component);

Nav.defaultProps = {
  routes: []
};

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user;


  var isAuthenticated = user.api_token && user.api_token.length > 0;

  return { isAuthenticated: isAuthenticated, user: user };
};

var mapStateToDispatch = function mapStateToDispatch(dispatch) {
  return {
    logout: (0, _redux.bindActionCreators)(_logout.logout, dispatch),
    setMenu: (0, _redux.bindActionCreators)(_setMenu.setMenu, dispatch),
    changeLanguage: (0, _redux.bindActionCreators)(_changeLanguage.changeLanguage, dispatch)
  };
};

exports.default = (0, _reactRouter.withRouter)((0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(Nav));