import React from 'react';
import {createApplicationWithAuth} from '../actions/create-application';
import {updatePayload} from '../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import {Redirect} from 'react-router-dom';
import Warning from './Warning';
import Q from '../configs/questions'

const PAGE = 'create-application';

class CreateApplication extends React.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.renderForm = this.renderForm.bind(this);

    this.state = {
      invalid: []
    }
  }

  static validateEmail(email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  }

  submit() {
    this.props.createApplicationWithAuth(this.props.payload);
  }

  renderForm() {
    const {error, loading, payload, questions, language} = this.props;

    let button = (
      <button
        disabled={loading}
        id="submit"
        onClick={this.submit}
        className="button">{loading ? <i className="fa fa-cog fa-spin" /> : 'Create Application'}
      </button>
    );

    return (
      <div>
        <form>
          <div className={"form-group "}>
            <label>{questions[Q.LOAN_AMOUNT][language]}</label>
            <input
              disabled={loading}
              onChange={(e) => this.props.updatePayload(Q.LOAN_AMOUNT, PAGE, e.target.value)}
              value={payload[Q.LOAN_AMOUNT]}
              className="form-control form-transparent"
              id={Q.LOAN_AMOUNT}
              placeholder={200}/>
          </div>
          <div className={"form-group "}>
            <label>{questions[Q.BUSINESS_NAME][language]}</label>
            <input
              disabled={loading}
              onChange={(e) => this.props.updatePayload(Q.BUSINESS_NAME, PAGE, e.target.value)}
              value={payload[Q.BUSINESS_NAME]}
              className="form-control form-transparent"
              id={Q.BUSINESS_NAME}
              placeholder={questions[Q.BUSINESS_NAME][language]}/>
          </div>
          <div className={"form-group "}>
            <label>{questions[Q.BUSINESS_DESCRIPTION][language]}</label>
            <input
              onChange={(e) => this.props.updatePayload(Q.BUSINESS_DESCRIPTION, PAGE, e.target.value)}
              disabled={loading}
              value={payload[Q.BUSINESS_DESCRIPTION]}
              type="name"
              className="form-control form-transparent"
              id={Q.BUSINESS_DESCRIPTION}
              placeholder={questions[Q.BUSINESS_DESCRIPTION][language]}/>
          </div>
          <div className={"form-group "}>
            <label>{questions[Q.BUSINESS_PRODUCT][language]}</label>
            <input
              onChange={(e) => this.props.updatePayload(Q.BUSINESS_PRODUCT, PAGE, e.target.value)}
              disabled={loading}
              value={payload[Q.BUSINESS_PRODUCT]}
              className="form-control form-transparent"
              id={Q.BUSINESS_PRODUCT}
              placeholder={questions[Q.BUSINESS_PRODUCT][language]}/>
          </div>
        </form>
        {button}
        {error ? <Warning error={error}/> : null}
      </div>
    );
  }

  render() {
    return (
      <div>
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
  } = payloadByPage[PAGE] || {
    loading: false,
    error: null,
    payload: {}
  };

  const loggedIn = user && user.token && user.token.length > 0;

  return { loggedIn, loading, error, payload };
};

const mapDispatchToProps = dispatch => {
  return {
    updatePayload: bindActionCreators(updatePayload, dispatch),
    createApplicationWithAuth: bindActionCreators(createApplicationWithAuth, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateApplication);