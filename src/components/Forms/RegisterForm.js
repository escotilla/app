import React from 'react';
import {register} from '../../actions/register';
import {updatePayload} from '../../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import {Redirect} from 'react-router-dom';
import Warning from '../Warning';
import formConfig from '../../configs/register-form'
import Input from '../Input';
import {validate} from 'validate.js';

const PAGE = 'register';

class RegisterForm extends React.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.renderForm = this.renderForm.bind(this);

    this.state = {
      validation: {}
    }
  }

  submit() {
    const {payload, register} = this.props;
    const validation = validate(payload, formConfig.constraints, {fullMessages: false});

    this.setState({validation: validation});

    if (validation === undefined) {
      register(payload);
    }
  }

  renderForm() {
    const {error, loading, payload} = this.props;
    const validation = this.state.validation;

    const {password} = payload;

    let passwordClass = validation && validation.hasOwnProperty('password');

    let button = (
      <button
        disabled={loading}
        id="submit"
        onClick={this.submit}
        className="button">{loading ? <i className="fa fa-cog fa-spin"/> : 'Create Account'}
      </button>
    );

    return (
      <div>
        <form>
          {formConfig.questions.map(question => (
            <Input
              loading={loading}
              validation={validation}
              question={question}
              value={payload.hasOwnProperty(question.inputId) ? payload[question.inputId] : ''}
              inputId={question.inputId}
              page={PAGE}
              formatter={question.formatter}
              parser={question.parser}
            />
          ))}
          <div className={"form-group " + passwordClass}>
            <input
              onChange={(e) => this.props.updatePayload('password', PAGE, e.target.value)}
              disabled={loading}
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
    const {loggedIn} = this.props;

    if (loggedIn) {
      return <Redirect to='/account'/>;
    }

    return (this.renderForm());
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

export default connect(mapStateToProps, mapDispatchToProps)(RegisterForm);