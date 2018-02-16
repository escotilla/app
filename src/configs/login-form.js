import Q from '../configs/questions';

const constraints = {
  [Q.EMAIL]: {
    presence: {
      message: 'errors.required',
      allowEmpty: false
    }
  },
  password: {
    presence: {
      message: 'errors.required',
      allowEmpty: false
    }
  }
};

const questions = [
  {
    inputId: Q.EMAIL,
    helper: ''
  },
  {
    inputId: 'password',
    type: 'password',
    helper: ''
  }
];

export default {
  constraints,
  questions
};