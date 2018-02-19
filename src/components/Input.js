import React from 'react';
import {createApplicationWithAuth} from '../actions/create-application';
import {updatePayload} from '../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Language from '../utilities/language';

class Input extends React.Component {
  constructor(props) {
    super(props);
    this.updatePayload = this.updatePayload.bind(this);
  }

  updatePayload(e) {
    const {
      page,
      question,
    } = this.props;

    const {
      inputId,
      parser
    } = question;

    this.props.updatePayload(inputId, page, (parser ? parser(e.target.value) : (e.target.type === 'checkbox' ? e.target.checked : e.target.value)));
  }
  render() {
    const {
      validation,
      loading,
      value,
      language,
      placeholder,
      question,
      helper,
      questions
    } = this.props;

    const formLabel = this.props.label;

    const {
      inputId,
      formatter,
      type,
      disabled,
    } = question;
    const hasError = validation && validation.hasOwnProperty(inputId);

    const feedback = hasError ? (
      <div style={{color: 'red'}} className="helper invalid-feedback">
        {Language.get(language, validation[inputId][0])}
      </div>
    ) : <div className="helper">
      {helper !== undefined ? helper : Language.get(language, inputId + '.helper')}
    </div>;

    return (
      <div className={"form-group " + (hasError ? 'has-error' : '')}>
        <label className="form-label">{Language.get(language, inputId + '.label') || formLabel}</label>
        <input
          required
          disabled={loading || disabled}
          onChange={this.updatePayload}
          value={formatter ? formatter(value) : value}
          checked={type === 'checkbox' ? value : null}
          className="form-input form-transparent"
          id={inputId}
          type={questions.hasOwnProperty(inputId) ? questions[inputId]['input_type'] : question.type || 'text'}
          placeholder={Language.get(language, inputId + '.placeholder') || placeholder}/>
        {feedback}
      </div>
    );
  }
}


const mapStateToProps = state => {
  const {
    language,
    question
  } = state;

  const questions = question.questions || [];

  return {language, questions};
};

const mapDispatchToProps = dispatch => {
  return {
    updatePayload: bindActionCreators(updatePayload, dispatch),
    createApplicationWithAuth: bindActionCreators(createApplicationWithAuth, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Input);