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

var _language = require('../utilities/language');

var _language2 = _interopRequireDefault(_language);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NavBar = function (_React$Component) {
  _inherits(NavBar, _React$Component);

  function NavBar(props) {
    _classCallCheck(this, NavBar);

    return _possibleConstructorReturn(this, (NavBar.__proto__ || Object.getPrototypeOf(NavBar)).call(this, props));
  }

  _createClass(NavBar, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          routes = _props.routes,
          language = _props.language,
          isAuthenticated = _props.isAuthenticated;


      var navLinks = routes.map(function (route) {
        return route.includeInNav ? _react2.default.createElement(
          'li',
          { key: route.path, className: 'nav-item' },
          _react2.default.createElement(
            _reactRouterDom.NavLink,
            {
              className: 'nav-link',
              exact: route.exact,
              to: route.path,
              id: route.path,
              activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
            route.title
          )
        ) : null;
      });

      var authLinks = _react2.default.createElement(
        'ul',
        { className: 'navbar-nav flex-row' },
        _react2.default.createElement(
          'select',
          {
            style: { maxWidth: '120px', display: 'inline-block' },
            value: language,
            onChange: function onChange(e) {
              return _this2.props.changeLanguage(e.target.value);
            },
            className: 'form-control' },
          _react2.default.createElement(
            'option',
            { value: 'spanish' },
            _language2.default.get(language, 'spanish')
          ),
          _react2.default.createElement(
            'option',
            { value: 'english' },
            _language2.default.get(language, 'english')
          )
        ),
        isAuthenticated ? _react2.default.createElement(
          'li',
          { onClick: function onClick() {
              return _this2.props.logout();
            } },
          _react2.default.createElement(
            'button',
            { className: 'btn btn-primary' },
            'Logout'
          )
        ) : _react2.default.createElement(
          'li',
          null,
          _react2.default.createElement(
            _reactRouterDom.NavLink,
            {
              style: { display: 'inline-block' },
              to: '/login',
              activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
            _react2.default.createElement(
              'button',
              { className: 'btn btn-primary' },
              _language2.default.get(language, 'button.login')
            )
          ),
          _react2.default.createElement(
            _reactRouterDom.NavLink,
            {
              style: { display: 'inline-block' },
              to: '/register',
              activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
            _react2.default.createElement(
              'button',
              { className: 'btn btn-primary' },
              _language2.default.get(language, 'button.register')
            )
          )
        )
      );

      return _react2.default.createElement(
        'nav',
        { className: 'escotilla-navbar' },
        _react2.default.createElement(
          'div',
          { className: 'justify-content-between' },
          _react2.default.createElement(
            _reactRouterDom.NavLink,
            { className: 'navbar-brand', to: '/' },
            _react2.default.createElement('div', {
              className: 'brand-logo',
              style: {
                backgroundImage: 'url("/public/images/logo.png")'
              } })
          ),
          isAuthenticated ? null : navLinks
        ),
        authLinks
      );
    }
  }]);

  return NavBar;
}(_react2.default.Component);

Nav.defaultProps = {
  routes: []
};

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      language = state.language;


  var isAuthenticated = user.api_token && user.api_token.length > 0;

  return { isAuthenticated: isAuthenticated, user: user, language: language };
};

var mapStateToDispatch = function mapStateToDispatch(dispatch) {
  return {
    logout: (0, _redux.bindActionCreators)(_logout.logout, dispatch),
    changeLanguage: (0, _redux.bindActionCreators)(_changeLanguage.changeLanguage, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(NavBar);