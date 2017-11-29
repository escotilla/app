import React from 'react';
import {NavLink} from 'react-router-dom';

class Nav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const routes = this.props.routes;

    const navLinks = routes.map(route => {
      return (
        <li key={route.path}>
          <NavLink
            exact={route.exact}
            to={route.path}
            id={route.path}
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            {route.title}
          </NavLink>
        </li>
      );
    });

    return (
      <nav className="navbar navbar-inverse">
        <div className="container-fluid">
            <ul className="nav navbar-nav">
              {navLinks}
            </ul>
        </div>
      </nav>
    );
  }
}

Nav.defaultProps = {
  routes: []
};

export default Nav;