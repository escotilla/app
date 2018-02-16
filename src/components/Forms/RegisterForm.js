import React from 'react';
import {register} from '../../actions/register';
import {updatePayload} from '../../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import formConfig from '../../configs/register-form'
import Form from './Form';

const PAGE = 'register';

class RegisterForm extends React.Component {
  render() {
    return <Form
      onSubmit={register}
      page={PAGE}
      formConfig={formConfig}
      buttonText="Create Account"
    />;
  }
}

const mapStateToProps = state => {};

const mapDispatchToProps = dispatch => {
  return {
    updatePayload: bindActionCreators(updatePayload, dispatch),
    register: bindActionCreators(register, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(RegisterForm);