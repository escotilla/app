import React from 'react';
import {NavLink} from 'react-router-dom';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {bindActionCreators} from 'redux';

class Nav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const routes = this.props.routes;

    const navLinks = routes.map(route => {
      return (
        route.includeInNav ?
        <li key={route.path}>
          <NavLink
            exact={route.exact}
            to={route.path}
            id={route.path}
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            {route.title}
          </NavLink>
        </li> : null
      );
    });

    const authLinks = this.props.isAuthenticated ? (
      <ul className="nav navbar-nav">
        <li onClick={() => this.props.logout()}>
          <a>Logout</a>
        </li>
      </ul>
    ) : (
      <ul className="nav navbar-nav">
        <li>
          <NavLink
            to='/login'
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            Login
          </NavLink>
        </li>
        <li>
          <NavLink
            to='/register'
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            Register
          </NavLink>
        </li>
      </ul>
    );

    return (
      <div>
      <nav>
        <div className="container-fluid">
            {authLinks}
        </div>
      </nav>
        {this.props.isAuthenticated ? (
          <nav className="navbar navbar-inverse">
            <div className="container-fluid">
              <ul className="nav navbar-nav">
                <li>
                  <NavLink
                    to='/account'
                    activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
                    Account
                  </NavLink>
                  <NavLink
                    to='/settings'
                    activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
                    Settings
                  </NavLink>
                </li>
              </ul>
            </div>
          </nav>
        ) : (
          <nav className="navbar navbar-inverse">
            <div className="container-fluid">
              <ul className="nav navbar-nav">
                {navLinks}
              </ul>
            </div>
          </nav>
        )}
      </div>
    );
  }
}

Nav.defaultProps = {
  routes: []
};

const mapStateToProps = state => {
  const {
    user,
  } = state;

  const isAuthenticated = user.token && user.token.length > 0;

  return { isAuthenticated, user };
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch)
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(Nav);