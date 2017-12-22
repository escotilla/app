import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux'
class Account extends React.Component {
  render() {
    const { user } = this.props;

    return (
      <div>
        {JSON.stringify(user)}

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

export default connect(mapStateToProps, mapStateToDispatch)(Account);