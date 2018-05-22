'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _constraints;

var _questions = require('../configs/questions');

var _questions2 = _interopRequireDefault(_questions);

var _formatter = require('../utilities/formatter');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var constraints = (_constraints = {}, _defineProperty(_constraints, _questions2.default.LOAN_AMOUNT, {
  numericality: {
    lessThanOrEqualTo: 200,
    message: 'errors.amountMax'
  }
}), _defineProperty(_constraints, _questions2.default.EMAIL, {
  presence: {
    message: 'errors.required',
    allowEmpty: false
  }
}), _defineProperty(_constraints, _questions2.default.FULL_NAME, {
  presence: {
    message: 'errors.required',
    allowEmpty: false
  }
}), _defineProperty(_constraints, _questions2.default.PASSWORD, {
  presence: {
    message: 'errors.required',
    allowEmpty: false
  }
}), _defineProperty(_constraints, 'password', {
  presence: {
    message: 'errors.required',
    allowEmpty: false
  },
  equality: {
    attribute: _questions2.default.PASSWORD,
    message: 'errors.passwordMatch'
  }
}), _constraints);

var questions = [{
  inputId: _questions2.default.EMAIL
}, {
  inputId: _questions2.default.FULL_NAME
}, {
  inputId: _questions2.default.PASSWORD,
  type: 'password'
}, {
  inputId: 'password',
  type: 'password'
}];

exports.default = {
  constraints: constraints,
  questions: questions
};