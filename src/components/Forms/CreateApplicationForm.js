import React from 'react';
import {createApplicationWithAuth} from '../../actions/create-application';
import {updatePayload} from '../../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import formConfig from '../../configs/create-application-form'
import Form from './Form';

const PAGE = 'create-application';

class CreateApplicationForm extends React.Component {
  constructor(props) {
    super(props);
    this.renderForm = this.renderForm.bind(this);

    this.state = {
      validation: {}
    }
  }

  renderForm() {
    return (
      <Form
        onSubmit={this.props.createApplicationWithAuth}
        page={PAGE}
        formConfig={formConfig}
        buttonText="Create Application"
      />
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
    createApplicationWithAuth: bindActionCreators(createApplicationWithAuth, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateApplicationForm);