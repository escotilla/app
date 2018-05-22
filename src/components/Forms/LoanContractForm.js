import React from 'react';
import {updateApplicationWithAuth} from '../../actions/update-application';
import {updatePayload} from '../../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import formConfig from '../../configs/loan-contract-form'
import Form from './Form';
import Q from '../../configs/questions';

const PAGE = 'sign_agreement';

class LoanContractForm extends React.Component {
  constructor(props) {
    super(props);
    this.renderForm = this.renderForm.bind(this);

    this.state = {
      invalid: [],
      validation: {}
    }
  }

  renderForm() {
    const {answers, payload, applicationId, updateApplicationWithAuth} = this.props;
    const amount = answers[Q.LOAN_AMOUNT] || 0;

    return (
      <div>
        <Form
          answers={answers}
          onSubmit={() => updateApplicationWithAuth(payload, applicationId, PAGE)}
          page={PAGE}
          formConfig={formConfig}
          buttonText="Update Application"
        >
          <div>
            <p>I agree to borrow ${amount} and pay it all pay promptly, with interest.</p>
          </div>
        </Form>
      </div>
    );
  }

  render() {
    return this.renderForm();
  }
}


const mapStateToProps = state => {
  const {
    user,
    payloadByPage
  } = state;

  const {
    loading,
    error,
    payload,
  } = payloadByPage[PAGE] || {
    loading: false,
    error: null,
    payload: {}
  };

  const loggedIn = user && user.api_token && user.api_token.length > 0;

  return {loggedIn, loading, error, payload};
};

const mapDispatchToProps = dispatch => {
  return {
    updatePayload: bindActionCreators(updatePayload, dispatch),
    updateApplicationWithAuth: bindActionCreators(updateApplicationWithAuth, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(LoanContractForm);