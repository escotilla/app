import React from 'react';
import {register} from '../actions/register';
import {updatePayload} from '../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import {Redirect} from 'react-router-dom';
import RegisterForm from './Forms/RegisterForm'

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
          <div className="text-center">
            <h1>WE HELP YOU TO GROW
              YOUR DREAM BUSINESS</h1>
          </div>
        </div>
        <div className="register-container text-center">
          <h4>Sign up for an account.</h4>
          <RegisterForm/>
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
    payload: {
      name: '',
      email: '',
      password: ''
    }
  };

  const loggedIn = user && user.api_token && user.api_token.length > 0;

  return {loggedIn, loading, error, payload};
};

const mapDispatchToProps = dispatch => {
  return {
    updatePayload: bindActionCreators(updatePayload, dispatch),
    register: bindActionCreators(register, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Register);