import React from 'react';
import {login} from '../actions/login';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import {Redirect} from 'react-router-dom';
import Form from './Forms/Form'
import formConfig from '../configs/login-form'

const PAGE = 'login';

class Login extends React.Component {
  render() {
    const {loggedIn} = this.props;

    if (loggedIn) {
      return <Redirect to='/account'/>;
    }

    return (
      <div>
        <div className="register-container text-center">
          <h4>Sign in to your account.</h4>
          <div className="col-12">
            <Form
              onSubmit={this.props.login}
              page={PAGE}
              formConfig={formConfig}
              buttonText="Login"
            />
          </div>
        </div>
      </div>
    );
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
    login: bindActionCreators(login, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);