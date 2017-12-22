'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Home = require('../components/Home');

var _Home2 = _interopRequireDefault(_Home);

var _Settings = require('../components/Settings');

var _Settings2 = _interopRequireDefault(_Settings);

var _About = require('../components/About');

var _About2 = _interopRequireDefault(_About);

var _Register = require('../components/Register');

var _Register2 = _interopRequireDefault(_Register);

var _Login = require('../components/Login');

var _Login2 = _interopRequireDefault(_Login);

var _Account = require('../components/Account');

var _Account2 = _interopRequireDefault(_Account);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [{
  path: '/',
  title: 'Home',
  component: _Home2.default,
  exact: true,
  includeInNav: true
}, {
  path: '/about',
  title: 'About',
  component: _About2.default,
  includeInNav: true
}, {
  path: '/register',
  title: 'Register',
  component: _Register2.default
}, {
  path: '/login',
  title: 'Login',
  component: _Login2.default
}, {
  path: '/account',
  title: 'Account',
  component: _Account2.default,
  private: true
}, {
  path: '/settings',
  title: 'Settings',
  component: _Settings2.default,
  private: true
}];