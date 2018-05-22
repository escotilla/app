import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux'
import LoanContractForm from './Forms/LoanContractForm';
import Q from '../configs/questions';

class LoanContract extends React.Component {
  render() {
    const {user} = this.props;

    return (
      <div>{user.applications.map(app => app.answers[Q.AGREE_LOAN_CONTRACT] ? <h2>thanks</h2> : (
        <div>
          <h1>Please accept our contract</h1>
          <LoanContractForm
            answers={app.answers}
            applicationId={app.id}/>
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