import Q from '../configs/questions'
import {formatDollars} from '../utilities/formatter';

const constraints = {
  [Q.LOAN_AMOUNT]: {
    numericality: {
      lessThanOrEqualTo: 200,
      message: 'errors.amountMax'
    }
  },
  [Q.INFO_ACCURATE]: {
    inclusion: {
      within: [true],
      message: 'errors.info_accurate'
    }
  }
};

const questions = [
  {
    inputId: Q.FULL_NAME
  },
  {
    inputId: Q.LOAN_AMOUNT,
    placeholder: '$50.00',
    formatter: formatDollars,
    parser: (str) => str.replace(/[^0-9]/, '')
  },
  {
    inputId: Q.BUSINESS_NAME
  },
  {
    inputId: Q.BUSINESS_DESCRIPTION
  },
  {
    inputId: Q.BUSINESS_PRODUCT
  },
  {
    inputId: Q.INFO_ACCURATE,
    type: 'checkbox'
  }
];

export default {
  constraints,
  questions
};