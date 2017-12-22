'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.contact = contact;
exports.updatePayload = updatePayload;
exports.openContact = openContact;
exports.closeContact = closeContact;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _environment = require('../utilities/environment');

var _actionTypes = require('./action-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function contact(body) {
  return function (dispatch) {
    dispatch(contactStart());

    return (0, _isomorphicFetch2.default)((0, _environment.getApiUrl)() + 'contact', {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(function (response) {
      return response.json();
    }).then(handleErrors).then(function () {
      dispatch(contactSuccess());
    }).catch(function (err) {
      dispatch(contactFailure(err));
    });
  };
}

function handleErrors(response) {
  if (response.success === false) {
    throw Error(response.error);
  }

  return response;
}

function contactStart() {
  return {
    type: _actionTypes.CONTACT_INIT
  };
}

function contactSuccess() {
  return {
    type: _actionTypes.CONTACT_SUCCESS
  };
}

function contactFailure(err) {
  return {
    type: _actionTypes.CONTACT_FAILURE,
    error: err
  };
}

function updatePayload(id, text) {
  return {
    type: _actionTypes.UPDATE_PAYLOAD,
    id: id,
    text: text
  };
}

function openContact(page) {
  return {
    type: _actionTypes.OPEN_CONTACT,
    page: page
  };
}

function closeContact() {
  return {
    type: _actionTypes.CLOSE_CONTACT
  };
}