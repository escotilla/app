'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _redux = require('redux');

var _loadUser = require('../actions/load-user');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AppContainer = function (_React$Component) {
  _inherits(AppContainer, _React$Component);

  function AppContainer() {
    _classCallCheck(this, AppContainer);

    return _possibleConstructorReturn(this, (AppContainer.__proto__ || Object.getPrototypeOf(AppContainer)).apply(this, arguments));
  }

  _createClass(AppContainer, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.props.boot();
    }
  }, {
    key: 'render',
    value: function render() {
      if (this.props.booting) {
        return _react2.default.createElement(
          'div',
          { style: {
              height: '100vh',
              width: '100vw',
              background: '#212121',
              position: 'fixed',
              top: 0,
              left: 0
            } },
          _react2.default.createElement('div', { className: 'loader' })
        );
      }

      return _react2.default.createElement(
        'div',
        { className: 'container-fluid' },
        this.props.children
      );
    }
  }]);

  return AppContainer;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var boot = state.boot;


  return { booting: boot.booting };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    boot: (0, _redux.bindActionCreators)(_loadUser.boot, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(AppContainer);