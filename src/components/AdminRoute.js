import React from 'react';
import {connect} from 'react-redux';
import {Route, Redirect} from 'react-router-dom'

class AdminRoute extends React.Component {
  render() {
    const {route, isAdmin} = this.props;

    return (
      <Route path={route.path}
             exact={route.exact}
             render={props => (
               isAdmin ? (
                 <route.component {...props} routes={route.routes}/>
               ) : (
                 <Redirect to={{
                   pathname: '/login',
                   state: {from: props.location}
                 }}/>
               )
             )}/>
    );
  }
}

const mapStateToProps = state => {
  const {
    user,
  } = state;

  const isAuthenticated = user.api_token && user.api_token.length > 0;
  const isAdmin = isAuthenticated && user.role === 'admin';

  return { isAdmin };
};

export default connect(mapStateToProps)(AdminRoute);