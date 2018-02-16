'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _RouteWithSubRoutes = require('./RouteWithSubRoutes');

var _RouteWithSubRoutes2 = _interopRequireDefault(_RouteWithSubRoutes);

var _SideBar = require('./SideBar');

var _SideBar2 = _interopRequireDefault(_SideBar);

var _Account = require('./Account');

var _Account2 = _interopRequireDefault(_Account);

var _Users = require('./Users');

var _Users2 = _interopRequireDefault(_Users);

var _environment = require('../utilities/environment');

var _reactRedux = require('react-redux');

var _CreateApplication = require('./CreateApplication');

var _CreateApplication2 = _interopRequireDefault(_CreateApplication);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Dashboard = function (_React$Component) {
  _inherits(Dashboard, _React$Component);

  function Dashboard() {
    _classCallCheck(this, Dashboard);

    return _possibleConstructorReturn(this, (Dashboard.__proto__ || Object.getPrototypeOf(Dashboard)).apply(this, arguments));
  }

  _createClass(Dashboard, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (position) {
          console.log(position, position.coords.latitude, position.coords.longitude);
        });
      } else {
        /* geolocation IS NOT available */
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          routes = _props.routes,
          match = _props.match,
          location = _props.location,
          user = _props.user,
          question = _props.question,
          language = _props.language;

      var isAdmin = user.role === 'admin';

      var hasApplications = user.applications && user.applications.length > 0;

      var params = (0, _environment.parseSearch)(location.search || '');

      if (params && params.success && params.paymentId && params.token && params.PayerID) {
        // add paypal stuff
      }

      if (isAdmin) {
        return _react2.default.createElement(_Users2.default, null);
      }

      if (!hasApplications) {
        return _react2.default.createElement(
          'div',
          { className: 'container-fluid' },
          _react2.default.createElement(
            'div',
            { className: 'row' },
            _react2.default.createElement(_CreateApplication2.default, { language: language, questions: question.questions })
          )
        );
      }

      return _react2.default.createElement(
        'div',
        { className: 'container-fluid' },
        _react2.default.createElement(
          'div',
          { className: 'row' },
          _react2.default.createElement(_SideBar2.default, { routes: routes }),
          _react2.default.createElement(
            'div',
            { className: 'col-sm' },
            routes.map(function (route, i) {
              return _react2.default.createElement(_RouteWithSubRoutes2.default, _extends({}, route, { key: i }));
            }),
            match.isExact ? _react2.default.createElement(_Account2.default, null) : null
          )
        )
      );
    }
  }]);

  return Dashboard;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      application = state.application,
      question = state.question,
      language = state.language,
      payloadByPage = state.payloadByPage;


  return {
    user: user,
    application: application,
    question: question,
    language: language,
    payloadByPage: payloadByPage
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps)(Dashboard);