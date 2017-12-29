'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.store = undefined;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _index = require('./reducers/index');

var _index2 = _interopRequireDefault(_index);

var _reactRouterDom = require('react-router-dom');

var _routes = require('./configs/routes');

var _routes2 = _interopRequireDefault(_routes);

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _App = require('./components/App');

var _App2 = _interopRequireDefault(_App);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Grab state from server-generated html
var preloadedState = window.__PRELOADED_STATE__;

// Get rid of it!
delete window.__PRELOADED_STATE__;

var store = exports.store = (0, _redux.createStore)(_index2.default, preloadedState, (0, _redux.applyMiddleware)(_reduxThunk2.default));

_reactDom2.default.render(_react2.default.createElement(
  _reactRouterDom.BrowserRouter,
  null,
  _react2.default.createElement(
    _reactRedux.Provider,
    { store: store },
    _react2.default.createElement(_App2.default, { routes: _routes2.default })
  )
), document.getElementById('app'));