import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux'
class UploadDocuments extends React.Component {
  render() {
    const { user } = this.props;

    return (
      <div>
        <h1>Upload Documents page</h1>
        <p>You are logged in as {user.email}</p>

        <h1>There will be a dropzone here</h1>
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

export default connect(mapStateToProps, mapStateToDispatch)(UploadDocuments);