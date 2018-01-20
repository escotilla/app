'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _logout = require('../actions/logout');

var _download = require('../actions/download');

var _login = require('../actions/login');

var _redux = require('redux');

var _environment = require('../utilities/environment');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UploadDocuments = function (_React$Component) {
  _inherits(UploadDocuments, _React$Component);

  function UploadDocuments() {
    _classCallCheck(this, UploadDocuments);

    return _possibleConstructorReturn(this, (UploadDocuments.__proto__ || Object.getPrototypeOf(UploadDocuments)).apply(this, arguments));
  }

  _createClass(UploadDocuments, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var api_token = this.props.api_token;
      var application_ids = this.props.application_ids;
      var updateUserSuccess = this.props.updateUserSuccess;

      if (typeof window !== 'undefined') {
        var Dropzone = require('dropzone');
        var dz = new Dropzone("div#dropzone", {
          url: (0, _environment.getApiUrl)() + "/document/create",
          headers: {
            "Cache-Control": "",
            "X-Requested-With": ""
          },
          init: function init() {
            this.on("sending", function (file, xhr, formData) {
              formData.append("api_token", api_token);
              formData.append("application_id", application_ids && application_ids.length > 0 ? application_ids[0] : 'bnan');
            });

            this.on("success", function (file, response) {
              if (response.success) {
                updateUserSuccess(response.data);
              }
            });
          }
        });
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          isLoading = _props.isLoading,
          uploaded_files = _props.uploaded_files,
          download = _props.download,
          api_token = _props.api_token;

      var hasFiles = uploaded_files && uploaded_files.length;

      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'h1',
          null,
          'Upload Documents page'
        ),
        _react2.default.createElement(
          'div',
          { className: 'drop-zone', id: 'dropzone' },
          _react2.default.createElement(
            'div',
            { className: 'dz-message' },
            'Drop files here or click to upload.'
          ),
          _react2.default.createElement(
            'div',
            { className: 'fallback' },
            _react2.default.createElement('input', { name: 'file', type: 'file', multiple: true })
          )
        ),
        _react2.default.createElement(
          'table',
          { className: 'table table-striped text-center' },
          _react2.default.createElement(
            'thead',
            { className: 'thead-dark' },
            _react2.default.createElement(
              'tr',
              null,
              _react2.default.createElement(
                'th',
                { className: 'text-center' },
                'File Name'
              ),
              _react2.default.createElement(
                'th',
                { className: 'text-center' },
                'Size'
              ),
              _react2.default.createElement(
                'th',
                { className: 'text-center' },
                'Download'
              )
            )
          ),
          _react2.default.createElement(
            'tbody',
            null,
            hasFiles && uploaded_files.map(function (file) {
              return _react2.default.createElement(
                'tr',
                null,
                _react2.default.createElement(
                  'td',
                  null,
                  file.original_file_name
                ),
                _react2.default.createElement(
                  'td',
                  null,
                  Math.floor(file.size / 1000),
                  ' kB'
                ),
                _react2.default.createElement(
                  'td',
                  null,
                  _react2.default.createElement('i', {
                    className: 'fa fa-download fa-2x link',
                    'aria-hidden': 'true',
                    onClick: function onClick() {
                      return isLoading ? null : download({
                        api_token: api_token,
                        uploaded_file_id: file.uploaded_file_id
                      }, file.original_file_name, file.mime_type);
                    }
                  })
                )
              );
            })
          )
        )
      );
    }
  }]);

  return UploadDocuments;
}(_react2.default.Component);

var mapStateToProps = function mapStateToProps(state) {
  var user = state.user,
      file = state.file;


  var uploaded_files = user.uploaded_files;
  var api_token = user.api_token;
  var application_ids = user.application_ids;
  var isLoading = file.loading;

  return { uploaded_files: uploaded_files, api_token: api_token, application_ids: application_ids, user: user, isLoading: isLoading };
};

var mapStateToDispatch = function mapStateToDispatch(dispatch) {
  return {
    logout: (0, _redux.bindActionCreators)(_logout.logout, dispatch),
    download: (0, _redux.bindActionCreators)(_download.download, dispatch),
    updateUserSuccess: (0, _redux.bindActionCreators)(_login.updateUserSuccess, dispatch)
  };
};

exports.default = (0, _reactRedux.connect)(mapStateToProps, mapStateToDispatch)(UploadDocuments);