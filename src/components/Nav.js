import React from 'react';
import {NavLink} from 'react-router-dom';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {changeLanguage} from '../actions/change-language';
import {bindActionCreators} from 'redux';
import Language from '../utilities/language';

class Nav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {routes, language, isAuthenticated} = this.props;

    const navLinks = routes.map(route => route.includeInNav ? (
      <li key={route.path}>
        <NavLink
          exact={route.exact}
          to={route.path}
          id={route.path}
          activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
          {route.title}
        </NavLink>
      </li>
    ) : null);

    const authLinks = (
      <ul className="nav navbar-nav">
        <li>
          <div style={{padding: '10px 15px'}}>
            <button
              className="btn btn-light"
              onClick={() => this.props.changeLanguage('spanish')}>
              <img className="flag" src="/public/images/spain-flag.svg"/>
              {Language.get(language, 'spanish')}
            </button>
          </div>
        </li>
        <li>
          <div style={{padding: '10px 15px'}}>
            <button
              className="btn btn-light"
              onClick={() => this.props.changeLanguage('english')}>
              <img className="flag" src="/public/images/uk.svg"/>
              {Language.get(language, 'english')}
            </button>
          </div>
        </li>
        {isAuthenticated ? (
          <li onClick={() => this.props.logout()}>
            <a>Logout</a>
          </li>
        ) : null}
        {isAuthenticated ? null : [<li>
          <NavLink
            to='/login'
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            <button className="btn btn-primary">
              {Language.get(language, 'button.login')}
            </button>
          </NavLink>
        </li>,
          <li>
            <NavLink
              to='/register'
              activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
              <button className="btn btn-primary">
                {Language.get(language, 'button.register')}
              </button>
            </NavLink>
          </li>]}
      </ul>
    );

    const linkNav = isAuthenticated ? null : (
      <nav className="escotilla-nav-auth">
        <div className="container-fluid">
          <ul className="nav navbar-nav">
            {navLinks}
          </ul>
        </div>
      </nav>
    );

    return (
      <div>
        <nav className="escotilla-nav">
          <div className="escotilla-nav-flex">
            <div className="escotilla-nav-flex-logo">
              <NavLink to='/'>
                <img src="/public/images/logo.png"/>
              </NavLink>
            </div>
            <div className="escotilla-nav-flex-links">
              <div className="container-fluid">
                {authLinks}
              </div>
              <div>
              </div>
            </div>
          </div>
        </nav>
        {linkNav}
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

export default connect(mapStateToProps, mapStateToDispatch)(Nav);