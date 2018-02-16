'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NavIcon = function (_React$Component) {
  _inherits(NavIcon, _React$Component);

  function NavIcon() {
    _classCallCheck(this, NavIcon);

    return _possibleConstructorReturn(this, (NavIcon.__proto__ || Object.getPrototypeOf(NavIcon)).apply(this, arguments));
  }

  _createClass(NavIcon, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          selected = _props.selected,
          icon = _props.icon,
          onClick = _props.onClick;


      return _react2.default.createElement(
        'div',
        {
          className: "burger " + (selected ? 'selected' : ''),
          onClick: onClick },
        _react2.default.createElement('i', { className: "fa fa-2x " + icon })
      );
    }
  }]);

  return NavIcon;
}(_react2.default.Component);

NavIcon.defaultProps = {
  icon: 'fa-globe',
  onClick: null
};

exports.default = NavIcon;