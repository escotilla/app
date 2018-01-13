'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.download = download;
exports.downloadSuccess = downloadSuccess;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _downloadjs = require('downloadjs');

var _downloadjs2 = _interopRequireDefault(_downloadjs);

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function download(body, filename, extension) {
  return function (dispatch) {
    dispatch(downloadStart());

    var headers = new Headers({
      'Content-Type': 'application/json'
    });

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + '/document/read', {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers
    }).then(function (response) {
      return response.blob();
    }).then(function (blob) {
      return (0, _downloadjs2.default)(blob, filename, extension);
    }).then(function () {
      return dispatch(downloadSuccess());
    }).catch(function (err) {
      dispatch(downloadFailure(err));
    });
  };
}

function downloadStart() {
  return {
    type: _actionTypes.DOWNLOAD_INIT
  };
}

function downloadSuccess() {
  return {
    type: _actionTypes.DOWNLOAD_SUCCESS
  };
}

function downloadFailure(err) {
  return {
    type: _actionTypes.DOWNLOAD_FAILURE,
    error: err
  };
}