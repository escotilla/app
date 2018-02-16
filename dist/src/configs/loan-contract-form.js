'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _questions = require('../configs/questions');

var _questions2 = _interopRequireDefault(_questions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var constraints = _defineProperty({}, _questions2.default.AGREE_LOAN_CONTRACT, {
  inclusion: {
    within: [true],
    message: 'errors.info_accurate'
  }
});

var questions = [{
  inputId: _questions2.default.AGREE_LOAN_CONTRACT,
  type: 'checkbox'
}];

exports.default = {
  constraints: constraints,
  questions: questions
};