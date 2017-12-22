'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.isNode = isNode;
exports.hasWindow = hasWindow;
exports.getApiUrl = getApiUrl;
exports.handleErrors = handleErrors;
function isNode() {
  return (typeof process === 'undefined' ? 'undefined' : _typeof(process)) === 'object' && process.title && process.title === 'node';
}

function hasWindow() {
  return typeof window !== 'undefined' && window !== null;
}

function getApiUrl() {
  return 'http://flowerpunk-env.us-east-1.elasticbeanstalk.com';
}

function handleErrors(response) {
  if (response.success === false) {
    throw Error(response.error);
  }

  return response;
}