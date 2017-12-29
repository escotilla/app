import React from 'react';
import {register} from '../actions/register';
import {updatePayload} from '../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import {Redirect} from 'react-router-dom';
import Warning from './Warning';

const REGISTER = 'register';

class Register extends React.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.verifiedSubmit = this.verifiedSubmit.bind(this);
    this.renderForm = this.renderForm.bind(this);

    this.state = {
      invalid: []
    }
  }

  static validateEmail(email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  }

  verifiedSubmit(email, name, password) {
    this.props.register({
      email: email,
      name: name,
      password: password
    });
  }

  submit() {
    const {email, name, password} = this.props.payload;
    const invalid = [];

    if (!Register.validateEmail(email)) {
      invalid.push('email');
    }

    if (!name || name.length < 2) {
      invalid.push('name');
    }

    if (!password || password.length < 2) {
      invalid.push('password');
    }

    if (invalid.length === 0) {
      this.setState({
        invalid: invalid
      });

      this.verifiedSubmit(email, name, password);
    } else {
      this.setState({
        invalid: invalid
      });
    }
  }

  renderForm() {
    const {error, loading, loggedIn, payload} = this.props;

    const {email, name, password} = payload;

    if (loggedIn) {
      return <Redirect to='/account' />;
    }

    const {invalid} = this.state;

    let emailClass = invalid.indexOf('email') > -1 ? 'has-error' : '';
    let nameClass = invalid.indexOf('name') > -1 ? 'has-error' : '';
    let passwordClass = invalid.indexOf('password') > -1 ? 'has-error' : '';

    let button = (
      <button
        disabled={loading}
        id="submit"
        onClick={this.submit}
        className="button">{loading ? <i className="fa fa-cog fa-spin" /> : 'Create Account'}
      </button>
    );

    return (
      <div>
        <form>
          <div className={"form-group " + emailClass}>
            <input
              disabled={loading}
              onChange={(e) => this.props.updatePayload('email', REGISTER, e.target.value)}
              value={email}
              type="email"
              className="form-control form-transparent"
              id="email"
              placeholder="Email or phone"/>
          </div>
          <div className={"form-group " + nameClass}>
            <input
              onChange={(e) => this.props.updatePayload('name', REGISTER, e.target.value)}
              disabled={loading}
              value={name}
              type="name"
              className="form-control form-transparent"
              id="name"
              placeholder="Name"/>
          </div>
          <div className={"form-group " + passwordClass}>
            <input
              onChange={(e) => this.props.updatePayload('password', REGISTER, e.target.value)}
              disabled={loading}
              value={password}
              type="password"
              className="form-control form-transparent"
              id="password"
              placeholder="Password"/>
          </div>
        </form>
        {button}
        {error ? <Warning code={code} message={message}/> : null}
      </div>
    );
  }

  render() {
    return (
      <div className="register-container text-center">
        <h4>Sign up for an account.</h4>
        {this.renderForm()}
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
  } = payloadByPage[REGISTER] || {
    loading: false,
    error: null,
    payload: {
      name: '',
      email: '',
      password: ''
    }
  };

  const loggedIn = user && user.token && user.token.length > 0;

  return { loggedIn, loading, error, payload };
};

const mapDispatchToProps = dispatch => {
  return {
    updatePayload: bindActionCreators(updatePayload, dispatch),
    register: bindActionCreators(register, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Register);