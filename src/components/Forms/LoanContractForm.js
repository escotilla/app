import React from 'react';
import {updateApplicationWithAuth} from '../../actions/update-application';
import {updatePayload} from '../../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import formConfig from '../../configs/loan-contract-form'
import {validate} from 'validate.js';
import Form from './Form';
import Q from '../../configs/questions';

const PAGE = 'sign_agreement';

class LoanContractForm extends React.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.renderForm = this.renderForm.bind(this);

    this.state = {
      invalid: [],
      validation: {}
    }
  }

  submit() {
    const {payload, applicationId, updateApplicationWithAuth, application} = this.props;
    const validation = validate(payload, formConfig.constraints, {fullMessages: false});

    this.setState({validation: validation});

    if (validation === undefined) {
      updateApplicationWithAuth(payload, applicationId, PAGE);
    }
  }

  renderForm() {
    const amount = this.props.application.answers[Q.LOAN_AMOUNT] || 0;

    return (
      <div>
        <Form
          onSubmit={this.props.createApplicationWithAuth}
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