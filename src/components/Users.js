import React from 'react';
import {connect} from 'react-redux';
import {getUsersIfAdmin} from '../actions/get-users';
import {bindActionCreators} from 'redux';

class Users extends React.Component {
  componentWillMount() {
    this.props.getUsersIfAdmin();
  }

  render() {
    const users = this.props.users;
    const {current_page, last_page, loading} = users;

    if (loading) {
      return <h1>LOADING...</h1>
    }

    const current = users.users;
    console.log(this);
    return <div>{current.map(user => <div><h4>{user.name}</h4><p>{user.email}</p></div>)}</div>;
  }
}

const mapStateToProps = state => {
  const {
    users,
    application,
    question,
    language,
    payloadByPage
  } = state;

  return {users, application, question, language, payloadByPage};
};

const mapStateToDispatch = dispatch => {
  return {
    getUsersIfAdmin: bindActionCreators(getUsersIfAdmin, dispatch)
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(Users);