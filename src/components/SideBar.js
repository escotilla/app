import React from 'react';
import {NavLink} from 'react-router-dom';

class SideBar extends React.Component {
  render() {
    return (
      <div className="col-md-3 col-lg-2 side-bar d-none d-md-block">
        <ul className="nav flex-column">
          <li className="nav-item">
            <NavLink to='/account' exact={true} activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>Account Home</NavLink>
          </li>
          {this.props.routes.map((route, i) => (
            <li className="nav-item" key={i}>
              <NavLink
                to={route.path}
                activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
                {route.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default SideBar;