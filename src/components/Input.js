import React from 'react';
import {createApplicationWithAuth} from '../actions/create-application';
import {updatePayload} from '../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Language from '../utilities/language';

class Input extends React.Component {
  render() {
    const {
      validation,
      loading,
      value,
      questions,
      language,
      placeholder,
      page,
      question
    } = this.props;

    const {
      inputId,
      formatter,
      parser,
      type,
      disabled,
    } = question;
    const hasError = validation && validation.hasOwnProperty(inputId);

    const feedback = hasError ? (
      <div className="invalid-feedback">
        {Language.get(language, validation[inputId][0])}
      </div>
    ) : null;

    return (
      <div className={"form-group " + (hasError ? 'has-error' : '')}>
        <label>{questions[inputId][language]}</label>
        <input
          required
          disabled={loading || disabled}
          onChange={(e) => this.props.updatePayload(inputId, page, (parser ? parser(e.target.value) : (e.target.type === 'checkbox' ? e.target.checked : e.target.value)))}
          value={formatter ? formatter(value) : value}
          checked={type === 'checkbox' ? value : null}
          className="form-control form-transparent"
          id={inputId}
          type={type || 'text'}
          placeholder={questions[inputId][language] || placeholder}/>
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