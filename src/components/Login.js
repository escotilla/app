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
        <div className="register-container text-center pt-5">
          <h4 className="pt-2">Sign in to your account.</h4>
          <div className="col-12 col-md-6 offset-md-3 col-lg-4 offset-lg-4">
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
    user
  } = state;


  const loggedIn = user && user.api_token && user.api_token.length > 0;

  return {loggedIn};
};

const mapDispatchToProps = dispatch => {
  return {
    login: bindActionCreators(login, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);