'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouterDom = require('react-router-dom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Status = function Status(_ref) {
  var code = _ref.code,
      children = _ref.children;
  return _react2.default.createElement(_reactRouterDom.Route, { render: function render(_ref2) {
      var staticContext = _ref2.staticContext;

      if (staticContext) staticContext.status = code;
      return children;
    } });
};

exports.default = Status;