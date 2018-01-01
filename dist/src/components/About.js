"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var About = function About(_ref) {
  var match = _ref.match;
  return _react2.default.createElement(
    "div",
    { className: "col-xs-12" },
    _react2.default.createElement(
      "h1",
      { id: "home-header-text" },
      "About page"
    ),
    _react2.default.createElement(
      "p",
      null,
      "We do awesome stuff!"
    )
  );
};

exports.default = About;