'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _logout = require('../actions/logout');

var _changeLanguage = require('../actions/change-language');

var _redux = require('redux');

var _setMenu = require('../actions/set-menu');

var _reactTransitionGroup = require('react-transition-group');

var _reactRouterDom = require('react-router-dom');

var _language = require('../utilities/language');

var _language2 = _interopRequireDefault(_language);

var _Dropdown = require('./Dropdown');

var _Dropdown2 = _interopRequireDefault(_Dropdown);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var Shift = function Shift(_ref) {
  var children = _ref.children,
      props = _objectWithoutProperties(_ref, ['children']);

  return _react2.default.createElement(
    _reactTransitionGroup.CSSTransition,
    _extends({}, props, {
      timeout: 600,
      classNames: 'shift'
    }),
    children
  );
};

var MenuOverlay = function (_React$Component) {
  _inherits(MenuOverlay, _React$Component);

  function MenuOverlay() {
    _classCallCheck(this, MenuOverlay);

    return _possibleConstructorReturn(this, (MenuOverlay.__proto__ || Object.getPrototypeOf(MenuOverlay)).apply(this, arguments));
  }

  _createClass(MenuOverlay, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(newProps) {
      if (this.props.location.pathname !== newProps.location.pathname) {
        this.props.setMenu('closed');
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          routes = _props.routes,
          menu = _props.menu,
          language = _props.language,
          isAuthenticated = _props.isAuthenticated;


      var routeSet = routes;

      if (isAuthenticated) {
        routeSet = routes.filter(function (route) {
          return route.path === '/account';
        })[0].routes;
      }

      var navLinks = routeSet.map(function (route) {
        return route.includeInNav ? _react2.default.createElement(
          _reactRouterDom.NavLink,
          {
            exact: route.exact,
            to: route.path,
            id: route.path,
            activeStyle: { color: 'rgba(0, 0, 255, 1)' } },
          _react2.default.createElement(
            'p',
            { key: route.path, className: 'hamburger-item' },
            route.title
          )
        ) : null;
      });

      var register = isAuthenticated ? null : _react2.default.createElement(
        _reactRouterDom.NavLink,
        {
          to: '/register',
          activeStyle: { color: 'rgba(0, 0, 255, 1)' } },
        _react2.default.createElement(
          'p',
          { className: 'hamburger-item' },
          _language2.default.get(language, 'button.register')
        )
      );

      var auth = isAuthenticated ? _react2.default.createElement(
        'p',
        {
          onClick: this.props.logout,
          className: 'hamburger-item' },
        'Logout'
      ) : _react2.default.createElement(
        _reactRouterDom.NavLink,
        {
          style: { display: 'inline-block' },
          to: '/login',
          activeStyle: { color: 'rgba(0, 0, 255, 1)' } },
        _react2.default.createElement(
          'p',
          { className: 'hamburger-item' },
          _language2.default.get(language, 'button.login')
        )
      );

      var dropdown = [{ value: 'spanish', text: _language2.default.get(language, 'spanish') }, { value: 'english', text: _language2.default.get(language, 'english') }];

      var shift = _react2.default.createElement(
        Shift,
        null,
        _react2.default.createElement(
          'div',
          { className: 'material-menu' },
          _react2.default.createElement(
            'div',
            { className: 'material-menu-inner' },
            _react2.default.createElement(
              'div',
              {
                onClick: function onClick() {
                  return _this2.props.setMenu('closed');
                },
                className: 'menu-logo' },
              _react2.default.createElement(
                _reactRouterDom.NavLink,
                { to: '/' },
                _react2.default.createElement('div', {
                  className: 'flex-row logo',
                  style: { backgroundImage: 'url("/public/images/logo.png")' } })
              )
            ),
            _react2.default.createElement(_Dropdown2.default, {
              value: language,
              onChange: function onChange(e) {
                _this2.props.changeLanguage(e.target.value);
                _this2.props.setMenu('closed');
              },
              options: dropdown
            }),
            _react2.default.createElement(
              'div',
              { className: "material-menu-links" },
              navLinks,
              _react2.default.createElement('hr', null),
              register,
              auth
            )
          )
        )
      );

      var pageBlock = _react2.default.createElement(
        _reactTransitionGroup.CSSTransition,
        {
          timeout: 600,
          classNames: 'fade'
        },
        _react2.default.createElement('div', {
          onClick: function onClick() {
            return _this2.props.setMenu('closed');
          },
          className: 'justify page-block colored' })
      );

      var block = menu !== 'closed' ? pageBlock : null;
      var inner = menu !== 'closed' ? shift : null;

      return _react2.default.createElement(
        _reactTransitionGroup.TransitionGroup,
        null,
        block,
        inner
      );
    }
  }]);

  return MenuOverlay;
}(_react2.default.Component);

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

exports.default = (0, _reactRouterDom.withRouter)((0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(MenuOverlay));