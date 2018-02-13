import React from 'react';
import {createApplicationWithAuth} from '../../actions/create-application';
import {updatePayload} from '../../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import Warning from '../Warning';
import formConfig from '../../configs/create-application-form'
import {validate} from 'validate.js';
import Input from '../Input';

const PAGE = 'create-application';

class CreateApplicationForm extends React.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.renderForm = this.renderForm.bind(this);

    this.state = {
      validation: {}
    }
  }

  submit() {
    const validation = validate(this.props.payload, formConfig.constraints, {fullMessages: false});
    this.setState({validation: validation});

    if (validation === undefined) {
      this.props.createApplicationWithAuth(this.props.payload);
    }
  }

  renderForm() {
    const {error, loading, payload} = this.props;
    const validation = this.state.validation;

    let button = (
      <button
        disabled={loading}
        id="submit"
        onClick={this.submit}
        className="button">{loading ? <i className="fa fa-cog fa-spin"/> : 'Create Application'}
      </button>
    );

    return (
      <div>
        <form>
          {formConfig.questions.map((question, i) => (
            <Input
              key={i}
              loading={loading}
              validation={validation}
              value={payload[question.inputId]}
              page={PAGE}
              question={question}
            />
          ))}
        </form>
        {button}
        {error ? <Warning error={error}/> : null}
      </div>
    );
  }

  render() {
    return this.renderForm();
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
    updatePayload: bindActionCreators(updatePayload, dispatch),
    createApplicationWithAuth: bindActionCreators(createApplicationWithAuth, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateApplicationForm);