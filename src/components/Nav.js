import React from 'react';
import {NavLink} from 'react-router-dom';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {changeLanguage} from '../actions/change-language';
import {bindActionCreators} from 'redux';
import Hamburger from './Hamburger';
import {withRouter} from 'react-router'
import {setMenu} from '../actions/set-menu';

class Nav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {routes, location} = this.props;

    return (
      <nav className="navbar justify-content-between flex-row escotilla-navbar">
        <div
          onClick={() => this.props.setMenu('closed')}
          className="flex-row">
          <NavLink className="brand-logo" to='/'>
            <div
              className="flex-row"
              style={{backgroundImage: 'url("/public/images/logo.png")'}}/>
          </NavLink>
        </div>
        <Hamburger
          location={location}
          routes={routes}/>
      </nav>
    );
  }
}

Nav.defaultProps = {
  routes: []
};

const mapStateToProps = state => {
  const {
    user
  } = state;

  const isAuthenticated = user.api_token && user.api_token.length > 0;

  return {isAuthenticated, user};
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch),
    setMenu: bindActionCreators(setMenu, dispatch),
    changeLanguage: bindActionCreators(changeLanguage, dispatch),
  }
};

export default withRouter(connect(mapStateToProps, mapStateToDispatch)(Nav));