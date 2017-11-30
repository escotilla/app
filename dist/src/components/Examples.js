'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouterDom = require('react-router-dom');

var _RouteWithSubRoutes = require('./RouteWithSubRoutes');

var _RouteWithSubRoutes2 = _interopRequireDefault(_RouteWithSubRoutes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Examples = function (_React$Component) {
  _inherits(Examples, _React$Component);

  function Examples(props) {
    _classCallCheck(this, Examples);

    return _possibleConstructorReturn(this, (Examples.__proto__ || Object.getPrototypeOf(Examples)).call(this, props));
  }

  _createClass(Examples, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          match = _props.match,
          routes = _props.routes;


      return _react2.default.createElement(
        'div',
        { className: 'col-xs-12' },
        _react2.default.createElement(
          'h3',
          null,
          _react2.default.createElement(
            _reactRouterDom.NavLink,
            { to: match.url },
            'Example Gallery'
          )
        ),
        match.isExact ? _react2.default.createElement(Thumbnails, { match: match, routes: routes }) : null,
        routes.map(function (route, i) {
          return _react2.default.createElement(_RouteWithSubRoutes2.default, {
            component: route.component,
            path: route.path,
            key: i });
        })
      );
    }
  }]);

  return Examples;
}(_react2.default.Component);

var Thumbnails = function Thumbnails(_ref) {
  var routes = _ref.routes;
  return _react2.default.createElement(
    'div',
    { className: 'panel panel-default' },
    _react2.default.createElement(
      'div',
      { className: 'panel-body' },
      _react2.default.createElement(
        'p',
        { id: 'select-example-text' },
        'Select an example'
      ),
      routes.map(function (route, i) {
        return _react2.default.createElement(Thumbnail, {
          to: route.path,
          title: route.title,
          key: i });
      })
    )
  );
};

var Thumbnail = function Thumbnail(_ref2) {
  var to = _ref2.to,
      title = _ref2.title;
  return _react2.default.createElement(
    'div',
    { className: 'col-xs-6 col-sm-3' },
    _react2.default.createElement(
      _reactRouterDom.NavLink,
      {
        className: 'thumbnail',
        to: to },
      title
    )
  );
};

exports.default = (0, _reactRouterDom.withRouter)(Examples);