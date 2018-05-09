import React from 'react';
import {updateApplicationWithAuth} from '../../actions/update-application';
import {updatePayload} from '../../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import Warning from '../Warning';
import formConfig from '../../configs/review-application-form'
import {validate} from 'validate.js';
import Input from '../Input';
import Form from '../Forms/Form'

const PAGE = 'review_profile';

class ReviewApplication extends React.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.renderForm = this.renderForm.bind(this);

    this.state = {
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

    return (
      <div>
        <Form
          onSubmit={this.submit}
          answers={answers}
          loading={loading}
          payload={payload}
          page={PAGE}
          formConfig={formConfig}
          buttonText="Update"
          error={error}
        />
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

export default connect(mapStateToProps, mapDispatchToProps)(ReviewApplication);