import Q from '../configs/questions'
import {formatDollars} from '../utilities/formatter';

const constraints = {
  [Q.LOAN_AMOUNT]: {
    numericality: {
      lessThanOrEqualTo: 200,
      message: 'errors.amountMax'
    },
    presence: {
      message: 'errors.required',
      allowEmpty: false
    }
  },
  [Q.BUSINESS_NAME]: {
    presence: {
      message: 'errors.required',
      allowEmpty: false
    }
  },
  [Q.BUSINESS_DESCRIPTION]: {
    presence: {
      message: 'errors.required',
      allowEmpty: false
    }
  },
  [Q.BUSINESS_PRODUCT]: {
    presence: {
      message: 'errors.required',
      allowEmpty: false
    }
  }
};

const questions = [
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
  }
];

export default {
  constraints,
  questions
};