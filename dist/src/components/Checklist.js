'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouterDom = require('react-router-dom');

var _language = require('../utilities/language');

var _language2 = _interopRequireDefault(_language);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var checklistConfig = {
  review_profile: {
    path: '/account/profile'
  },
  upload_documents: {
    path: '/account/upload-documents'
  },
  sign_agreement: {
    path: '/account/loan-contract'
  }
};

var Checklist = function (_React$Component) {
  _inherits(Checklist, _React$Component);

  function Checklist() {
    _classCallCheck(this, Checklist);

    return _possibleConstructorReturn(this, (Checklist.__proto__ || Object.getPrototypeOf(Checklist)).apply(this, arguments));
  }

  _createClass(Checklist, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          checklist = _props.checklist,
          language = _props.language,
          payloadByPage = _props.payloadByPage;


      return _react2.default.createElement(
        'div',
        { className: 'list-group' },
        _react2.default.createElement(
          'a',
          { className: 'list-group-item list-group-item-action active' },
          'Todo List'
        ),
        checklist.map(function (item) {
          var loading = payloadByPage.hasOwnProperty(item.title) && payloadByPage[item.title].loading;
          var badgeClass = item.status === 'complete' ? 'badge-success' : 'badge-warning';

          return _react2.default.createElement(
            _reactRouterDom.NavLink,
            {
              to: checklistConfig[item.title].path,
              className: 'list-group-item list-group-item-action justify-content-between align-items-center' },
            _language2.default.get(language, 'checklist.' + item.title),
            !loading ? _react2.default.createElement(
              'span',
              { className: "badge badge-pill " + badgeClass },
              item.status
            ) : _react2.default.createElement('i', { className: 'fa fa-cog fa-spin' })
          );
        })
      );
    }
  }]);

  return Checklist;
}(_react2.default.Component);

exports.default = Checklist;