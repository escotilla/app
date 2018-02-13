import Q from '../configs/questions'

const constraints = {
  [Q.AGREE_LOAN_CONTRACT]: {
    inclusion: {
      within: [true],
      message: 'errors.info_accurate'
    }
  }
};

const questions = [
  {
    inputId: Q.AGREE_LOAN_CONTRACT,
    type: 'checkbox'
  }
];

export default {
  constraints,
  questions
};