'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _language = require('../utilities/language');

var _language2 = _interopRequireDefault(_language);

var _reactRouterDom = require('react-router-dom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Home = function Home(_ref) {
  var language = _ref.language,
      loggedIn = _ref.loggedIn;


  if (loggedIn) {
    return _react2.default.createElement(_reactRouterDom.Redirect, { to: '/account' });
  }

  return _react2.default.createElement(
    'div',
    null,
    _react2.default.createElement(
      'div',
      {
        style: {
          backgroundImage: 'url("/public/images/background-shop.jpg")',
          height: '25vw'
        },
        className: 'jumbotron hero-image' },
      _react2.default.createElement(
        'div',
        { className: 'hero-text' },
        _react2.default.createElement(
          'h3',
          { id: 'home-header-text' },
          _language2.default.get(language, 'home.header.part_1')
        ),
        _react2.default.createElement(
          'h3',
          { id: 'home-header-text' },
          _react2.default.createElement(
            'strong',
            null,
            _language2.default.get(language, 'home.header.part_2')
          )
        ),
        _react2.default.createElement(
          'h3',
          { id: 'home-header-text' },
          _language2.default.get(language, 'home.header.part_3')
        ),
        _react2.default.createElement(
          _reactRouterDom.NavLink,
          { to: '/register' },
          _react2.default.createElement(
            'button',
            { className: 'btn btn-primary btn-lg' },
            _language2.default.get(language, 'button.get_started')
          )
        )
      )
    ),
    _react2.default.createElement(
      'div',
      { className: 'container mb-5 mt-5' },
      _react2.default.createElement(
        'div',
        { className: 'col-12 text-center mb-5 mt-5' },
        _react2.default.createElement(
          'h2',
          null,
          'How it works'
        ),
        _react2.default.createElement(
          'h6',
          null,
          'Apply quickly online directly from your Computer or Mobile Phone'
        )
      ),
      _react2.default.createElement(
        'div',
        { className: 'row mb-5 mt-2' },
        _react2.default.createElement(
          'div',
          { className: 'col-12 col-sm-4 text-center' },
          _react2.default.createElement('i', { className: 'fa fa-user-circle fa-5x', 'aria-hidden': 'true' }),
          _react2.default.createElement(
            'h6',
            null,
            'Step 1'
          ),
          _react2.default.createElement(
            'h5',
            null,
            'Tell us about your business'
          ),
          _react2.default.createElement(
            'h6',
            { className: 'mb-5' },
            'Create an Escotilla profile and complete our simple online application'
          )
        ),
        _react2.default.createElement(
          'div',
          { className: 'col-12 col-sm-4 text-center' },
          _react2.default.createElement('i', { className: 'fa fa-user-circle fa-5x', 'aria-hidden': 'true' }),
          _react2.default.createElement(
            'h6',
            null,
            'Step 1'
          ),
          _react2.default.createElement(
            'h5',
            null,
            'Tell us about your business'
          ),
          _react2.default.createElement(
            'h6',
            { className: 'mb-5' },
            'Create an Escotilla profile and complete our simple online application'
          )
        ),
        _react2.default.createElement(
          'div',
          { className: 'col-12 col-sm-4 text-center' },
          _react2.default.createElement('i', { className: 'fa fa-user-circle fa-5x', 'aria-hidden': 'true' }),
          _react2.default.createElement(
            'h6',
            null,
            'Step 1'
          ),
          _react2.default.createElement(
            'h5',
            null,
            'Tell us about your business'
          ),
          _react2.default.createElement(
            'h6',
            { className: 'mb-5' },
            'Create an Escotilla profile and complete our simple online application'
          )
        )
      )
    )
  );
};

var mapStateToProps = function mapStateToProps(state) {
  var language = state.language,
      user = state.user;


  var loggedIn = user && user.api_token;

  return { language: language, loggedIn: loggedIn };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps)(Home);