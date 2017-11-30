'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouterDom = require('react-router-dom');

var _Nav = require('./Nav');

var _Nav2 = _interopRequireDefault(_Nav);

var _RouteWithSubRoutes = require('./RouteWithSubRoutes');

var _RouteWithSubRoutes2 = _interopRequireDefault(_RouteWithSubRoutes);

var _Footer = require('./Footer');

var _Footer2 = _interopRequireDefault(_Footer);

var _routes = require('../configs/routes');

var _routes2 = _interopRequireDefault(_routes);

var _NotFound = require('./NotFound');

var _NotFound2 = _interopRequireDefault(_NotFound);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var App = function App() {
  return _react2.default.createElement(
    'div',
    null,
    _react2.default.createElement(_Nav2.default, { routes: _routes2.default }),
    _react2.default.createElement(
      _reactRouterDom.Switch,
      null,
      _routes2.default.map(function (route, i) {
        return _react2.default.createElement(_RouteWithSubRoutes2.default, _extends({}, route, { key: i }));
      }),
      _react2.default.createElement(_reactRouterDom.Route, { component: _NotFound2.default })
    ),
    _react2.default.createElement(_Footer2.default, null)
  );
};

exports.default = App;