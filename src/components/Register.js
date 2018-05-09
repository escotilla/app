import React from 'react';
import {register} from '../actions/register';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import {Redirect} from 'react-router-dom';
import Form from './Forms/Form'
import formConfig from '../configs/register-form'

const PAGE = 'register';

class Register extends React.Component {
  render() {
    const {loggedIn} = this.props;

    if (loggedIn) {
      return <Redirect to='/account'/>;
    }

    return (
      <div>
        <div
          style={{backgroundImage: "url('/public/images/application-banner.jpg')"}}
          className="hero-image jumbotron">
          <div className="text-center hero-text">
            <h1>WE HELP YOU TO GROW
              YOUR DREAM BUSINESS</h1>
          </div>
        </div>
        <div className="register-container text-center">
          <h4>Sign up for an account.</h4>
          <div className="col-12 col-md-6 offset-md-3 col-lg-4 offset-lg-4">
            <Form
              onSubmit={this.props.register}
              page={PAGE}
              formConfig={formConfig}
              buttonText="Create Account"
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
    register: bindActionCreators(register, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Register);