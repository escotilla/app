import Q from '../configs/questions'
import {formatDollars} from '../utilities/formatter';

const constraints = {
  [Q.LOAN_AMOUNT]: {
    numericality: {
      lessThanOrEqualTo: 200,
      message: 'errors.amountMax'
    }
  },

  [Q.EMAIL]: {
    presence: {
      message: 'errors.required',
      allowEmpty: false
    }
  },
  [Q.FULL_NAME]: {
    presence: {
      message: 'errors.required',
      allowEmpty: false
    }
  },
  [Q.PASSWORD]: {
    presence: {
      message: 'errors.required',
      allowEmpty: false
    }
  },
  password: {
    presence: {
      message: 'errors.required',
      allowEmpty: false
    },
    equality: {
      attribute: Q.PASSWORD,
      message: 'errors.passwordMatch'
    }
  }
};

const questions = [
  {
    inputId: Q.EMAIL
  },
  {
    inputId: Q.FULL_NAME
  },
  {
    inputId: Q.PASSWORD,
    type: 'password'
  },
  {
    inputId: 'password',
    type: 'password'
  }
];

export default {
  constraints,
  questions
};