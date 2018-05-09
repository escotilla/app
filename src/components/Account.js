import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux';
import Checklist from './Checklist';
import Q from '../configs/questions';

class Account extends React.Component {
  render() {
    const {user, language, payloadByPage} = this.props;

    return (
      <div>
        {user.applications.map(app => {
          return (
            <div>
              <h1>Loan application for: ${app.answers[Q.LOAN_AMOUNT]}</h1>
              <Checklist
                payloadByPage={payloadByPage}
                checklist={app.checklist}
                language={language}/>
            </div>
          )
        })}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    user,
    application,
    language,
    payloadByPage
  } = state;

  return {user, application, language, payloadByPage};
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch)
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(Account);