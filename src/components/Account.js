import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux';
import CreateApplication from './CreateApplication';
import Q from '../configs/questions';

class Account extends React.Component {
  render() {
    const {application, question, language} = this.props;

    const hasApplications = application.applications && application.applications.length > 0;

    if (application.loading) {
      return <div>loading...</div>;
    }

    return (hasApplications ? (
        <div>
          {application.applications.map(app => {
            return (
              <div>
                <h1>Loan application for: ${app.answers[Q.LOAN_AMOUNT]}</h1>
                <ul>{app.checklist.map(item => <li>{item.title + ': ' + item.status}</li>)}</ul>
              </div>
            )
          })}
        </div>
      ) : <CreateApplication language={language} questions={question.questions}/>
    );
  }
}

const mapStateToProps = state => {
  const {
    user,
    application,
    question,
    language
  } = state;

  return {user, application, question, language};
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch)
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(Account);