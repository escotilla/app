'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouterDom = require('react-router-dom');

var _PrivateRoute = require('./PrivateRoute');

var _PrivateRoute2 = _interopRequireDefault(_PrivateRoute);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RouteWithSubRoutes = function RouteWithSubRoutes(route) {
  return route.private ? _react2.default.createElement(_PrivateRoute2.default, { route: route }) : _react2.default.createElement(_reactRouterDom.Route, {
    path: route.path,
    exact: route.exact,
    render: function render(props) {
      return _react2.default.createElement(route.component, _extends({}, props, { routes: route.routes }));
    } });
};

exports.default = RouteWithSubRoutes;