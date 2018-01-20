import React from 'react';
import RouteWithSubRoutes from './RouteWithSubRoutes';
import SideBar from './SideBar';
import Account from './Account';

class Dashboard extends React.Component {
  render() {
    const {routes, match} = this.props;

    return (
      <div className="row">
        <SideBar routes={routes}/>
        <div className="col-12 col-sm-9 col-lg-10">
          {routes.map((route, i) => (
            <RouteWithSubRoutes {...route} key={i}/>
          ))}
          {match.isExact ? <Account/> : null}
        </div>
      </div>
    );
  }
}

export default Dashboard;