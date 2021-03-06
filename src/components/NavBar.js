import React from 'react';
import {NavLink} from 'react-router-dom';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {changeLanguage} from '../actions/change-language';
import {bindActionCreators} from 'redux';
import Language from '../utilities/language';

class NavBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {routes, language, isAuthenticated} = this.props;

    const navLinks = routes.map(route => route.includeInNav ? (
      <li key={route.path} className="nav-item">
        <NavLink
          className="nav-link"
          exact={route.exact}
          to={route.path}
          id={route.path}
          activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
          {route.title}
        </NavLink>
      </li>
    ) : null);

    const authLinks = (
      <ul className="navbar-nav flex-row">
        <select
          style={{maxWidth: '120px', display: 'inline-block'}}
          value={language}
          onChange={e => this.props.changeLanguage(e.target.value)}
          className="form-control">
          <option value="spanish">
            {Language.get(language, 'spanish')}
          </option>
          <option value="english">
            {Language.get(language, 'english')}
          </option>
        </select>
        {isAuthenticated ? (
          <li onClick={() => this.props.logout()}>
            <button className="btn btn-primary">Logout</button>
          </li>
        ) : <li>
          <NavLink
            style={{display: 'inline-block'}}
            to='/login'
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            <button className="btn btn-primary">
              {Language.get(language, 'button.login')}
            </button>
          </NavLink>
          <NavLink
            style={{display: 'inline-block'}}
            to='/register'
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            <button className="btn btn-primary">
              {Language.get(language, 'button.register')}
            </button>
          </NavLink>
        </li>}
      </ul>
    );

    return (
      <nav className="escotilla-navbar">
        <div className="justify-content-between">
          <NavLink className="navbar-brand" to='/'>
            <div
              className="brand-logo"
              style={{
                backgroundImage: 'url("/public/images/logo.png")'
              }}/>
          </NavLink>
            {isAuthenticated ? null : navLinks}
        </div>
        {authLinks}
      </nav>
    );
  }
}

Nav.defaultProps = {
  routes: []
};

const mapStateToProps = state => {
  const {
    user,
    language
  } = state;

  const isAuthenticated = user.api_token && user.api_token.length > 0;

  return {isAuthenticated, user, language};
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch),
    changeLanguage: bindActionCreators(changeLanguage, dispatch),
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(NavBar);