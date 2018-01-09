import React from 'react';
import {login} from '../actions/login';
import {updatePayload} from '../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import {Redirect} from 'react-router-dom';
import Warning from './Warning';
const LOGIN = 'login';

class Login extends React.Component {
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

  verifiedSubmit(email, password) {
    this.props.login({
      email: email,
      password: password
    });
  }

  submit() {
    const {email, password} = this.props.payload;
    const invalid = [];

    if (!Login.validateEmail(email)) {
      invalid.push('email');
    }

    if (!password || password.length < 2) {
      invalid.push('password');
    }

    if (invalid.length === 0) {
      this.setState({
        invalid: invalid
      });

      this.verifiedSubmit(email, password);
    } else {
      this.setState({
        invalid: invalid
      });
    }
  }

  renderForm() {
    const {
      error,
      loading,
      payload
    } = this.props;

    const {
      email,
      password
    } = payload;

    const invalid = this.state.invalid;

    let emailClass = invalid.indexOf('email') > -1 ? 'has-error' : '';
    let passwordClass = invalid.indexOf('password') > -1 ? 'has-error' : '';

    let button = (
      <button
        disabled={loading}
        id="submit"
        onClick={this.submit}
        className="button">{loading ? <i className="fa fa-cog fa-spin" /> : 'Login'}
      </button>
    );

    return (
      <div>
        <form>
          <div className={"form-group " + emailClass}>
            <input
              disabled={loading}
              onChange={(e) => this.props.updatePayload('email', LOGIN, e.target.value)}
              value={email}
              type="email"
              className="form-control form-transparent"
              id="email"
              placeholder="Email or phone"/>
          </div>
          <div className={"form-group " + passwordClass}>
            <input
              disabled={loading}
              onChange={(e) => this.props.updatePayload('password', LOGIN, e.target.value)}
              value={password}
              type="password"
              className="form-control form-transparent"
              id="password"
              placeholder="Password"/>
          </div>
        </form>
        {button}
        {error ? <Warning error={error}/> : null}
      </div>
    );
  }

  render() {
    const {
      loggedIn,
    } = this.props;

    if (loggedIn) {
      return <Redirect to='/account' />;
    }
    return (
      <div className="login-container text-center">
        <h4>Login</h4>
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
  } = payloadByPage[LOGIN] || {
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
    login: bindActionCreators(login, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);