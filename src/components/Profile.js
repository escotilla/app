import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux';
import CreateApplication from './CreateApplication';
import ReviewApplication from './Forms/ReviewApplication';

class Profile extends React.Component {
  render() {
    const {user, question, language} = this.props;

    const hasApplications = user.applications && user.applications.length > 0;

    return (hasApplications ? (
        <div>
          {user.applications.map(app => {
            return (
              <div className="container-fluid">
                <h2>My Profile</h2>
                <ReviewApplication applicationId={app.id} answers={app.answers}/>
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
    language,
    payloadByPage
  } = state;

  return {user, application, question, language, payloadByPage};
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch)
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(Profile);