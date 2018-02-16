'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouterDom = require('react-router-dom');

var _reactRedux = require('react-redux');

var _setMenu = require('../actions/set-menu');

var _changeLanguage = require('../actions/change-language');

var _redux = require('redux');

var _language = require('../utilities/language');

var _language2 = _interopRequireDefault(_language);

var _NavIcon = require('./NavIcon');

var _NavIcon2 = _interopRequireDefault(_NavIcon);

var _logout = require('../actions/logout');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Hamburger = function (_React$Component) {
  _inherits(Hamburger, _React$Component);

  function Hamburger(props) {
    _classCallCheck(this, Hamburger);

    var _this = _possibleConstructorReturn(this, (Hamburger.__proto__ || Object.getPrototypeOf(Hamburger)).call(this, props));

    _this.state = {
      open: false
    };
    return _this;
  }

  _createClass(Hamburger, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          routes = _props.routes,
          className = _props.className,
          menu = _props.menu,
          setMenu = _props.setMenu,
          language = _props.language,
          isAuthenticated = _props.isAuthenticated;


      var routeSet = routes;

      if (isAuthenticated) {
        routeSet = routes.filter(function (route) {
          return route.path === '/account';
        })[0].routes;
      }

      var languageLinks = [_react2.default.createElement(
        'h2',
        {
          className: "hamburger-item " + (language === 'spanish' ? 'active' : ''),
          onClick: function onClick() {
            return _this2.props.changeLanguage('spanish');
          } },
        _language2.default.get(language, 'spanish')
      ), _react2.default.createElement(
        'h2',
        {
          className: "hamburger-item " + (language === 'english' ? 'active' : ''),
          onClick: function onClick() {
            return _this2.props.changeLanguage('english');
          } },
        _language2.default.get(language, 'english')
      )];

      var navLinks = routeSet.map(function (route) {
        return route.includeInNav ? _react2.default.createElement(
          _reactRouterDom.NavLink,
          {
            exact: route.exact,
            to: route.path,
            id: route.path,
            activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
          _react2.default.createElement(
            'h2',
            { key: route.path, className: 'hamburger-item' },
            route.title
          )
        ) : null;
      });

      var langOpen = menu === 'lang';
      var menuOpen = menu === 'links';
      var closed = menu === 'closed';
      var linksClass = closed ? 'closed' : 'open';

      return _react2.default.createElement(
        'div',
        { className: "hamburger " + className },
        _react2.default.createElement(
          _reactRouterDom.NavLink,
          {
            onClick: function onClick() {
              return setMenu('closed');
            },
            to: isAuthenticated ? "#" : "/login" },
          _react2.default.createElement(_NavIcon2.default, {
            onClick: function onClick() {
              return _this2.props.logout();
            },
            icon: isAuthenticated ? "fa-sign-out" : "fa-sign-in" })
        ),
        _react2.default.createElement(_NavIcon2.default, {
          selected: langOpen,
          icon: langOpen ? "fa-times-circle" : "fa-globe",
          onClick: function onClick() {
            return langOpen ? setMenu('closed') : setMenu('lang');
          } }),
        _react2.default.createElement(_NavIcon2.default, {
          selected: menuOpen,
          icon: menuOpen ? "fa-times-circle" : "fa-bars",
          onClick: function onClick() {
            return menuOpen ? setMenu('closed') : setMenu('links');
          } }),
        _react2.default.createElement(
          'div',
          {
            onClick: function onClick() {
              return setMenu('closed');
            },
            className: "hamburger-links " + linksClass },
          menu === 'lang' ? languageLinks : navLinks
        )
      );
    }
  }]);

  return Hamburger;
}(_react2.default.Component);

Hamburger.defaultProps = {
  routes: []
};

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      language = state.language,
      menu = state.menu;


  var isAuthenticated = user.api_token && user.api_token.length > 0;

  return { isAuthenticated: isAuthenticated, user: user, language: language, menu: menu };
};

var mapStateToDispatch = function mapStateToDispatch(dispatch) {
  return {
    logout: (0, _redux.bindActionCreators)(_logout.logout, dispatch),
    setMenu: (0, _redux.bindActionCreators)(_setMenu.setMenu, dispatch),
    changeLanguage: (0, _redux.bindActionCreators)(_changeLanguage.changeLanguage, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(Hamburger);