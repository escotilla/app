import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux'
import LoanContractForm from './Forms/LoanContractForm';

class LoanContract extends React.Component {
  render() {
    const {user} = this.props;

    return (
      <div>{user.applications.map(app => (
        <div>
          <h1>Loan Contract page</h1>
          <p>You are logged in as {user.email}</p>
          <h1>Please accept our contract</h1>
          <LoanContractForm
            applicationId={app.id}
            answers={app.answers}/>
          <h3 onClick={() => this.props.logout()}> LOGOUT </h3>
        </div>
      ))}
      </div>
    )
  }
}

const mapStateToProps = state => {
  const {
    user
  } = state;

  return {user};
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch)
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(LoanContract);