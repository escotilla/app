'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _constraints;

var _questions = require('../configs/questions');

var _questions2 = _interopRequireDefault(_questions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var constraints = (_constraints = {}, _defineProperty(_constraints, _questions2.default.EMAIL, {
  presence: {
    message: 'errors.required',
    allowEmpty: false
  }
}), _defineProperty(_constraints, 'password', {
  presence: {
    message: 'errors.required',
    allowEmpty: false
  }
}), _constraints);

var questions = [{
  inputId: _questions2.default.EMAIL,
  helper: ''
}, {
  inputId: 'password',
  type: 'password',
  helper: ''
}];

exports.default = {
  constraints: constraints,
  questions: questions
};