import React from 'react';
import {connect} from 'react-redux';
import {Route, Redirect} from 'react-router-dom'

class PrivateRoute extends React.Component {
  render() {
    const {route, isAuthenticated} = this.props;

    return (
      <Route path={route.path}
             exact={route.exact}
             render={props => (
               isAuthenticated ? (
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

  const isAuthenticated = user.token && user.token.length > 0;
  return { isAuthenticated };
};

export default connect(mapStateToProps)(PrivateRoute);