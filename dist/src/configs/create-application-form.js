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
  },
  presence: {
    message: 'errors.required',
    allowEmpty: false
  }
}), _defineProperty(_constraints, _questions2.default.BUSINESS_NAME, {
  presence: {
    message: 'errors.required',
    allowEmpty: false
  }
}), _defineProperty(_constraints, _questions2.default.BUSINESS_DESCRIPTION, {
  presence: {
    message: 'errors.required',
    allowEmpty: false
  }
}), _defineProperty(_constraints, _questions2.default.BUSINESS_PRODUCT, {
  presence: {
    message: 'errors.required',
    allowEmpty: false
  }
}), _constraints);

var questions = [{
  inputId: _questions2.default.LOAN_AMOUNT,
  placeholder: '$50.00',
  formatter: _formatter.formatDollars,
  parser: function parser(str) {
    return str.replace(/[^0-9]/, '');
  }
}, {
  inputId: _questions2.default.BUSINESS_NAME
}, {
  inputId: _questions2.default.BUSINESS_DESCRIPTION
}, {
  inputId: _questions2.default.BUSINESS_PRODUCT
}];

exports.default = {
  constraints: constraints,
  questions: questions
};