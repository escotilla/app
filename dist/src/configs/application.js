'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _questions = require('../configs/questions');

var _questions2 = _interopRequireDefault(_questions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var constraints = {};

constraints[_questions2.default.LOAN_AMOUNT] = {
  numericality: {
    lessThanOrEqualTo: 200,
    message: 'errors.amountMax'
  },
  presence: {
    message: 'errors.required'
  }
};

var questions = [{
  inputId: _questions2.default.LOAN_AMOUNT,
  placeholder: '$50.00'
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