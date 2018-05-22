import React from 'react';
import {register} from '../../actions/register';
import {updatePayload} from '../../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import Warning from '../Warning';
import Input from '../Input';
import {validate} from 'validate.js';
import {NavLink} from 'react-router-dom';

class Form extends React.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.renderForm = this.renderForm.bind(this);

    this.state = {
      validation: {}
    }
  }

  submit() {
    const {payload, onSubmit, formConfig, page} = this.props;
    const validation = validate(payload, formConfig.constraints, {fullMessages: false});

    this.setState({validation: validation});

    if (validation === undefined) {
      onSubmit(payload, page);
    }
  }

  renderForm() {
    const {error, loading, payload, formConfig, page, buttonText, answers, to} = this.props;
    const validation = this.state.validation;

    let button = to ? (
      <NavLink disabled={Object.keys(payload).length === 0} to={to}>
        <button
          disabled={loading || Object.keys(payload).length === 0}
          id="submit"
          onClick={this.submit}
          className="button btn btn-primary">{loading ? <i className="fa fa-cog fa-spin"/> : buttonText}
        </button>
      </NavLink>
    ) : (
      <button
        disabled={loading || Object.keys(payload).length === 0}
        id="submit"
        onClick={this.submit}
        className="button btn btn-primary">{loading ? <i className="fa fa-cog fa-spin"/> : buttonText}
      </button>
    );

    return (
      <div className="m-2 m-sm-4 m-md-6 mb-10 card">
        {this.props.children}
        <form>
          {formConfig.questions.map(question => (
            <Input
              loading={loading}
              validation={validation}
              question={question}
              value={payload.hasOwnProperty(question.inputId) ? payload[question.inputId] : (answers[question.inputId] || '')}
              inputId={question.inputId}
              page={page}
              formatter={question.formatter}
              parser={question.parser}
              helper={question.helper}
              type={question.type}
            />
          ))}
        </form>
        {button}
        {error ? <Warning error={error}/> : null}
      </div>
    );
  }

  render() {
    return (this.renderForm());
  }
}

Form.defaultProps = {
  answers: {}
};

const mapStateToProps = (state, props) => {
  const {
    user,
    payloadByPage
  } = state;

  const {
    loading,
    error,
    payload
  } = payloadByPage[props.page] || {
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
    register: bindActionCreators(register, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);