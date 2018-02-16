'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _questions = require('../configs/questions');

var _questions2 = _interopRequireDefault(_questions);

var _formatter = require('../utilities/formatter');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var constraints = {};

constraints[_questions2.default.LOAN_AMOUNT] = {
  numericality: {
    lessThanOrEqualTo: 200,
    message: 'errors.amountMax'
  }
};

var questions = [{
  inputId: _questions2.default.EMAIL
}, {
  inputId: _questions2.default.FULL_NAME
}];

exports.default = {
  constraints: constraints,
  questions: questions
};