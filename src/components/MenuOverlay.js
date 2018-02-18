import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {changeLanguage} from '../actions/change-language';
import {bindActionCreators} from 'redux';
import {setMenu} from '../actions/set-menu';
import {CSSTransition, TransitionGroup} from 'react-transition-group';
import {withRouter, NavLink} from 'react-router-dom';
import Language from '../utilities/language';
import LanguageDropdown from './LanguageDropdown';

const Shift = ({children, ...props}) => (
  <CSSTransition
    {...props}
    timeout={600}
    classNames="shift"
  >
    {children}
  </CSSTransition>
);

class MenuOverlay extends React.Component {
  componentWillReceiveProps(newProps) {
    if (this.props.location.pathname !== newProps.location.pathname) {
      this.props.setMenu('closed');
    }
  }

  render() {
    const {routes, menu, language, isAuthenticated} = this.props;

    let routeSet = routes;

    if (isAuthenticated) {
      routeSet = routes.filter(route => route.path === '/account')[0].routes;
    }

    const navLinks = routeSet.map(route => route.includeInNav ? (
      <NavLink
        exact={route.exact}
        to={route.path}
        id={route.path}
        activeStyle={{color: 'rgba(0, 0, 255, 1)'}}>
        <p key={route.path} className="hamburger-item">
          {route.title}
        </p>
      </NavLink>
    ) : null);

    const register = (
      isAuthenticated ? null : <NavLink
        style={{display: 'inline-block'}}
        to='/register'
        className="mr-1"
        activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
        <button className="btn btn-primary">
          {Language.get(language, 'button.register')}
        </button>
      </NavLink>
    );

    const auth = (
      isAuthenticated ?
        <button
          onClick={this.props.logout}
          className="btn btn-primary">
          Logout
        </button> : <NavLink
          style={{display: 'inline-block'}}
          to='/login'
          activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
          <button className="btn btn-primary">
            {Language.get(language, 'button.login')}
          </button>
        </NavLink>
    );


    const shift = (
      <Shift>
        <div className="material-menu">
          <div className="material-menu-inner">
            <div
              onClick={() => this.props.setMenu('closed')}
              className="menu-logo">
              <NavLink to='/'>
                <div
                  className="flex-row logo"
                  style={{backgroundImage: 'url("/public/images/logo.png")'}}/>
              </NavLink>
            </div>
            <LanguageDropdown/>
            <div className={"material-menu-links"}>
              {navLinks}
            </div>
          </div>
          <div className="bottom-links">
            <div>
              {register}
              {auth}
            </div>
            <div>
              <NavLink to='/'>
                terms
              </NavLink>
              <NavLink to='/'>
                privacy
              </NavLink>
            </div>
          </div>
        </div>
      </Shift>
    );

    const pageBlock = (
      <CSSTransition
        timeout={600}
        classNames="fade"
      >
        <div
          onClick={() => this.props.setMenu('closed')}
          className="justify page-block colored"/>
      </CSSTransition>
    );

    const block = menu !== 'closed' ? pageBlock : null;
    const inner = menu !== 'closed' ? shift : null;

    return (
      <TransitionGroup>
        {block}
        {inner}
      </TransitionGroup>
    );
  }
}

const mapStateToProps = state => {
  const {
    user,
    language,
    menu
  } = state;

  const isAuthenticated = user.api_token && user.api_token.length > 0;

  return {isAuthenticated, user, language, menu};
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch),
    setMenu: bindActionCreators(setMenu, dispatch),
    changeLanguage: bindActionCreators(changeLanguage, dispatch),
  }
};

export default withRouter(connect(mapStateToProps, mapStateToDispatch)(MenuOverlay));