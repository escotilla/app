import Q from '../configs/questions'
import {formatDollars} from '../utilities/formatter';

const constraints = {};

constraints[Q.LOAN_AMOUNT] = {
  numericality: {
    lessThanOrEqualTo: 200,
    message: 'errors.amountMax'
  }
};

const questions = [
  {
    inputId: Q.EMAIL
  },
  {
    inputId: Q.FULL_NAME
  },
];

export default {
  constraints,
  questions
};