import React from 'react';
import {login} from '../actions/login';
import {updatePayload} from '../actions/update-payload';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'
import {Redirect} from 'react-router-dom';

class Warning extends React.Component {
  render() {
    const {code, message} = this.props;

    if (code && message) {
      return (
        <div>
          <div className="alert alert-warning" role="alert">{message}</div>
        </div>
      );
    } else {
      return (
        <div>
          <div className="alert alert-danger" role="alert">Critical Error!</div>
        </div>
      );
    }
  }
}

export default Warning;