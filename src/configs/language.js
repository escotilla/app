import Q from './questions';
let lang = {
  english: {
    english: 'English',
    spanish: 'Español (Spanish)',
    button: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      get_started: 'Let\'s get started!',
      passwordMatch: 'Passwords must match'
    },
    home: {
      header: {
        part_1: 'Small business loans',
        part_2: 'Fast and easy',
        part_3: 'Direct to your Paypal',
      }
    },
    errors: {
      amountMax: 'Amount cannot exceed $200',
      required: '*required',
      info_accurate: 'Please make sure your info is accurate',
      passwordMatch: 'Passwords must match'
    },
    checklist: {
      review_profile: 'Review Profile',
      upload_documents: 'Upload Documents',
      sign_agreement: 'Loan Contract',
    }
  },
  spanish: {
    english: 'English (Inglés)',
    spanish: 'Español',
    button: {
      login: 'Iniciar Sesion',
      logout: 'Logout',
      register: 'Registro',
      get_started: '¡Empecemos!'
    },
    home: {
      header: {
        part_1: 'Préstamos para pequeñas empresas',
        part_2: 'Rápido y fácil',
        part_3: 'Directamente al Paypal',
      }
    },
    errors: {
      amountMax: 'Amount no puede exceed $200',
      required: '*requiredo',
      info_accurate: 'Please make sure your info is accurate',
      passwordMatch: 'Passwords must match'
    },
    checklist: {
      review_profile: 'Review Profile',
      upload_documents: 'Upload Documents',
      sign_agreement: 'Loan Contract',
    }
  }
};

lang.spanish[Q.BUSINESS_DESCRIPTION] = {
  label: "Describe your business por favor",
  placeholder: "Landscaping",
  helper: ""
};

lang.english[Q.BUSINESS_DESCRIPTION] = {
  label: "Please describe your business",
  placeholder: "Landscaping",
  helper: ""
};

lang.spanish[Q.DOB] = {
  label: "Date of Birth",
  placeholder: "",
  helper: ""
};

lang.english[Q.DOB] = {
  label: "Date of Birth",
  placeholder: "",
  helper: ""
};

lang.spanish[Q.BUSINESS_PRODUCT] = {
  label: "What product or service do you sell?",
  placeholder: "Citrus fruits",
  helper: ""
};

lang.english[Q.BUSINESS_PRODUCT] = {
  label: "What product or service do you sell?",
  placeholder: "",
  helper: ""
};

lang.spanish[Q.BUSINESS_NAME] = {
  label: "Business Name",
  placeholder: "Juan's Fruits",
  helper: ""
};

lang.english[Q.BUSINESS_NAME] = {
  label: "Business Name",
  placeholder: "Juan's Tienda",
  helper: ""
};

lang.spanish[Q.LOAN_AMOUNT] = {
  label: "Loan Amount",
  placeholder: "$50",
  helper: "You may request up to $200"
};

lang.english[Q.LOAN_AMOUNT] = {
  label: "Loan Amount",
  placeholder: "$50",
  helper: "You may request up to $200"
};

lang.spanish[Q.FULL_NAME] = {
  label: "Full Name",
  placeholder: "Gabriel Enrique Gómez Torres",
  helper: "Please enter your full legal name"
};

lang.english[Q.FULL_NAME] = {
  label: "Full Name",
  placeholder: "Gabriel Enrique Gómez Torres",
  helper: "Please enter your full legal name"
};

lang.spanish[Q.EMAIL] = {
  label: "Email",
  placeholder: "gabrieltorres292@gmail.com",
  helper: "This will also be your username"
};

lang.english[Q.EMAIL] = {
  label: "Email",
  placeholder: "gabrieltorres292@gmail.com",
  helper: "This will also be your username"
};

lang.spanish[Q.INFO_ACCURATE] = {
  label: "I have reviewed all my information for accuracy",
  helper: ""
};

lang.english[Q.INFO_ACCURATE] = {
  label: "I have reviewed all my information for accuracy",
  helper: ""
};

lang.spanish[Q.AGREE_LOAN_CONTRACT] = {
  label: "I agree to the terms and conditions",
  helper: ""
};

lang.english[Q.AGREE_LOAN_CONTRACT] = {
  label: "I agree to the terms and conditions",
  helper: ""
};

lang.spanish[Q.PASSWORD] = {
  label: "Password",
  placeholder: "Password",
  helper: "Must be at least 8 characters"
};

lang.english[Q.PASSWORD] = {
  label: "Password",
  placeholder: "Password",
  helper: "Must be at least 8 characters"
};

lang.spanish['password'] = {
  label: "Password",
  placeholder: "Password",
  helper: "Please reenter your password"
};

lang.english['password'] = {
  label: "Password",
  placeholder: "Password",
  helper: "Please reenter your password"
};

export default lang;