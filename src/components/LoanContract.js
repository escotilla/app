import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux'
class LoanContract extends React.Component {
  render() {
    const { user } = this.props;

    return (
      <div>
        <h1>Loan Contract page</h1>
        <p>You are logged in as {user.email}</p>
        <h1>Please accept our contract</h1>

        <h3 onClick={() => this.props.logout()}> LOGOUT </h3>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    user,
  } = state;

  return { user };
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch)
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(LoanContract);