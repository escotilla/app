import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux';
import CreateApplication from './CreateApplication';
import Q from '../configs/questions';
import {NavLink} from 'react-router-dom';

class Account extends React.Component {
  render() {
    const {application, question, language} = this.props;

    const applications = application.applications ? application.applications : [];

    if (application.loading) {
      return <div>loadng...</div>;
    }

    console.log(this);
    return (
      <div className="row">
        <div className="col-xs-12 col-md-3 col-lg-2 side-bar">
          <ul>
            <li>
              <NavLink
                to='/account/upload-documents'
                activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
                Upload Documents
              </NavLink>
            </li>
            <li>
              <NavLink
                to='/account/loan-contract'
                activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
                Loan Contract
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="col-xs-12 col-md-9 col-lg-10">
          {application.applications && application.applications.length > 0 ? applications.map(app => {
            return (
              <div>
                <h1>Loan application for: ${app.answers[Q.LOAN_AMOUNT]}</h1>
                <ul>{app.checklist.map(item => <li>{item.title + ': ' + item.status}</li>)}</ul>
              </div>
            )
          }) : <CreateApplication
            language={language}
            questions={question.questions}/>}
        </div>
      </div>
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