import React from 'react';
import RouteWithSubRoutes from './RouteWithSubRoutes';
import SideBar from './SideBar';
import Account from './Account';
import Users from './Users';
import {parseSearch} from '../utilities/environment';
import {connect} from 'react-redux';
import CreateApplication from './CreateApplication';

class Dashboard extends React.Component {
  componentDidMount() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function (position) {
        console.log(position, position.coords.latitude, position.coords.longitude);
      });
    } else {
      /* geolocation IS NOT available */
    }
  }

  render() {
    const {routes, match, location, user, question, language} = this.props;
    const isAdmin = user.role === 'admin';

    const hasApplications = user.applications && user.applications.length > 0;

    const params = parseSearch(location.search || '');

    if (params && params.success && params.paymentId && params.token && params.PayerID) {
      // add paypal stuff
    }

    if (isAdmin) {
      return <Users />;
    }

    if (!hasApplications) {
      return (
        <div className="container-fluid">
          <div className="row">
            <div>
              <h2>To get started, please fill out some more information</h2>
            </div>
            <CreateApplication language={language} questions={question.questions}/>
          </div>
        </div>
      )
    }

    return (
      <div className="container-fluid">
        <div className="row">
          <SideBar routes={routes}/>
          <div className="col-sm">
            {routes.map((route, i) => (
              <RouteWithSubRoutes {...route} key={i}/>
            ))}
            {match.isExact ? <Account/> : null}
          </div>
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
    language,
    payloadByPage
  } = state;

  return {
    user,
    application,
    question,
    language,
    payloadByPage
  };
};

export default connect(mapStateToProps)(Dashboard);