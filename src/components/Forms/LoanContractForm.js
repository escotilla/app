import React from 'react';
import {updateApplicationWithAuth} from '../../actions/update-application';
import {updatePayload} from '../../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import Warning from '../Warning';
import formConfig from '../../configs/loan-contract-form'
import {validate} from 'validate.js';
import Input from '../Input';

const PAGE = 'loan-contract';

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
    const {payload, applicationId, updateApplicationWithAuth} = this.props;
    const validation = validate(payload, formConfig.constraints, {fullMessages: false});

    this.setState({validation: validation});

    if (validation === undefined) {
      updateApplicationWithAuth(payload, applicationId, PAGE);
    }
  }

  renderForm() {
    const {error, loading, payload, answers} = this.props;
    const validation = this.state.validation;

    let button = (
      <button
        disabled={loading || Object.keys(payload).length === 0}
        id="submit"
        onClick={this.submit}
        className="button">{loading ? <i className="fa fa-cog fa-spin"/> : 'Update'}
      </button>
    );

    return (
      <div>
        <form>
          {formConfig.questions.map(question => (
            <Input
              loading={loading}
              validation={validation}
              value={payload.hasOwnProperty(question.inputId) ? payload[question.inputId] : answers[question.inputId]}
              question={question}
              page={PAGE}
            />
          ))}
        </form>
        {button}
        {error ? <Warning error={error}/> : null}
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
    payload
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