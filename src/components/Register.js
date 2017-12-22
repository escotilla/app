import React from 'react';
import {register} from '../actions/register';
import {updatePayload} from '../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import {Redirect} from 'react-router-dom';

class Register extends React.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.verifiedSubmit = this.verifiedSubmit.bind(this);
    this.getMessageBox = this.getMessageBox.bind(this);

    this.state = {
      submitted: false,
      email: '',
      name: '',
      password: '',
      invalid: []
    }
  }

  static validateEmail(email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  }

  verifiedSubmit() {
    const {email, name, password} = this.props.payload;

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

    if (name.length < 2) {
      invalid.push('name');
    }

    if (password.length < 2) {
      invalid.push('password');
    }

    if (invalid.length === 0) {
      this.setState({
        submitted: true,
        invalid: invalid
      });

      this.verifiedSubmit()
    } else {
      this.setState({
        invalid: invalid
      });
    }
  }

  getMessageBox() {
    const {error, loading, success, email, name, password, user} = this.props;

    if (success && user.token) {
      return <Redirect to='/account' />;
    }

    const {invalid} = this.state;

    let emailClass = invalid.indexOf('email') > -1 ? 'has-error' : '';
    let nameClass = invalid.indexOf('name') > -1 ? 'has-error' : '';
    let passwordClass = invalid.indexOf('password') > -1 ? 'has-error' : '';

    let button = (
      <button
        disabled={success || loading || error}
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
              onChange={(e) => this.props.updatePayload('email', e.target.value)}
              value={email}
              type="email"
              className="form-control form-transparent"
              id="email"
              placeholder="Email or phone"/>
          </div>
          <div className={"form-group " + nameClass}>
            <input
              onChange={(e) => this.props.updatePayload('name', e.target.value)}
              value={name}
              type="name"
              className="form-control form-transparent"
              id="name"
              placeholder="Name"/>
          </div>
          <div className={"form-group " + passwordClass}>
            <input
              onChange={(e) => this.props.updatePayload('password', e.target.value)}
              value={password}
              type="password"
              className="form-control form-transparent"
              id="password"
              placeholder="Password"/>
          </div>
        </form>
        {button}
      </div>
    );
  }

  render() {
    let passwordBox = this.getMessageBox();

    return (
      <div className="register-container text-center">
        <h4>Sign up for Escotilla.</h4>
        {passwordBox}
      </div>
    );
  }
}


const mapStateToProps = state => {
  const {
    user,
    payload
  } = state;

  const {
    name,
    email,
    password
  } = payload || {
    name: '',
    email: '',
    password: ''
  };

  const {
    loading,
    error,
    success
  } = user || {
    loading: false,
    error: null,
    success: false
  };

  return { user, payload, loading, error, success, name, email, password };
};

const mapDispatchToProps = dispatch => {
  return {
    updatePayload: bindActionCreators(updatePayload, dispatch),
    register: bindActionCreators(register, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Register);