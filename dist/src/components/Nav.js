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
          language = _props.language;


      var navLinks = routes.map(function (route) {
        return route.includeInNav ? _react2.default.createElement(
          'li',
          { key: route.path },
          _react2.default.createElement(
            _reactRouterDom.NavLink,
            {
              exact: route.exact,
              to: route.path,
              id: route.path,
              activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
            route.title
          )
        ) : null;
      });

      var authLinks = this.props.isAuthenticated ? _react2.default.createElement(
        'ul',
        { className: 'nav navbar-nav' },
        _react2.default.createElement(
          'li',
          { onClick: function onClick() {
              return _this2.props.logout();
            } },
          _react2.default.createElement(
            'a',
            null,
            'Logout'
          )
        )
      ) : _react2.default.createElement(
        'ul',
        { className: 'nav navbar-nav' },
        _react2.default.createElement(
          'li',
          null,
          _react2.default.createElement(
            _reactRouterDom.NavLink,
            {
              to: '/login',
              activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
            _language2.default.get(language, 'button.login')
          )
        ),
        _react2.default.createElement(
          'li',
          null,
          _react2.default.createElement(
            _reactRouterDom.NavLink,
            {
              to: '/register',
              activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
            _language2.default.get(language, 'button.register')
          )
        )
      );

      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'nav',
          null,
          _react2.default.createElement(
            'div',
            { className: 'container-fluid' },
            authLinks
          )
        ),
        this.props.isAuthenticated ? _react2.default.createElement(
          'nav',
          { className: 'navbar navbar-inverse' },
          _react2.default.createElement(
            'div',
            { className: 'container-fluid' },
            _react2.default.createElement(
              'ul',
              { className: 'nav navbar-nav' },
              _react2.default.createElement(
                'li',
                null,
                _react2.default.createElement(
                  _reactRouterDom.NavLink,
                  {
                    to: '/account',
                    activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
                  'Account'
                ),
                _react2.default.createElement(
                  _reactRouterDom.NavLink,
                  {
                    to: '/settings',
                    activeStyle: { color: 'rgba(255, 0, 0, 1)' } },
                  'Settings'
                )
              )
            )
          )
        ) : _react2.default.createElement(
          'nav',
          { className: 'navbar navbar-inverse' },
          _react2.default.createElement(
            'div',
            { className: 'container-fluid' },
            _react2.default.createElement(
              'ul',
              { className: 'nav navbar-nav' },
              navLinks
            )
          )
        ),
        _react2.default.createElement(
          'div',
          null,
          _react2.default.createElement(
            'button',
            { onClick: function onClick() {
                return _this2.props.changeLanguage('spanish');
              } },
            'Spanish'
          ),
          _react2.default.createElement(
            'button',
            { onClick: function onClick() {
                return _this2.props.changeLanguage('english');
              } },
            'English'
          )
        )
      );
    }
  }]);

  return Nav;
}(_react2.default.Component);

Nav.defaultProps = {
  routes: []
};

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      language = state.language;


  var isAuthenticated = user.token && user.token.length > 0;

  return { isAuthenticated: isAuthenticated, user: user, language: language };
};

var mapStateToDispatch = function mapStateToDispatch(dispatch) {
  return {
    logout: (0, _redux.bindActionCreators)(_logout.logout, dispatch),
    changeLanguage: (0, _redux.bindActionCreators)(_changeLanguage.changeLanguage, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(Nav);