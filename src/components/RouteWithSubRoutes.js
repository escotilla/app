import React from 'react';
import {Route} from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const RouteWithSubRoutes = route => (
  route.private ? <PrivateRoute route={route}/> : <Route
    path={route.path}
    exact={route.exact}
    render={props => (
    <route.component {...props} routes={route.routes} />
    )}/>
);

export default RouteWithSubRoutes;