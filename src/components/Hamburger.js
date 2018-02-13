import React from 'react';
import {NavLink} from 'react-router-dom';
import {connect} from 'react-redux';
import {setMenu} from '../actions/set-menu';
import {changeLanguage} from '../actions/change-language';
import {bindActionCreators} from 'redux';
import Language from '../utilities/language';
import NavIcon from './NavIcon';
import {logout} from '../actions/logout';

class Hamburger extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false
    }
  }

  render() {
    const {routes, className, menu, setMenu, language, isAuthenticated} = this.props;

    let routeSet = routes;

    if (isAuthenticated) {
      routeSet = routes.filter(route => route.path === '/account')[0].routes;
    }

    const languageLinks = (
      [
        <h2
          className={"hamburger-item " + (language === 'spanish' ? 'active' : '')}
          onClick={() => this.props.changeLanguage('spanish')}>
          {Language.get(language, 'spanish')}
        </h2>,
        <h2
          className={"hamburger-item " + (language === 'english' ? 'active' : '')}
          onClick={() => this.props.changeLanguage('english')}>
          {Language.get(language, 'english')}
        </h2>
      ]
    );

    const navLinks = routeSet.map(route => route.includeInNav ? (
      <NavLink
        exact={route.exact}
        to={route.path}
        id={route.path}
        activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
        <h2 key={route.path} className="hamburger-item">
          {route.title}
        </h2>
      </NavLink>
    ) : null);

    const langOpen = menu === 'lang';
    const menuOpen = menu === 'links';
    const closed = menu === 'closed';
    const linksClass = closed ? 'closed' : 'open';

    return (
      <div className={"hamburger " + className}>
        <NavLink
          onClick={() => setMenu('closed')}
          to={isAuthenticated ? "#" : "/login"}>
          <NavIcon
            onClick={() => this.props.logout()}
            icon={isAuthenticated ? "fa-sign-out" : "fa-sign-in"}/>
        </NavLink>
        <NavIcon
          selected={langOpen}
          icon={langOpen ? "fa-times-circle" : "fa-globe"}
          onClick={() => langOpen ? setMenu('closed') : setMenu('lang')}/>
        <NavIcon
          selected={menuOpen}
          icon={menuOpen ? "fa-times-circle" : "fa-bars"}
          onClick={() => menuOpen ? setMenu('closed') : setMenu('links')}/>
        <div
          onClick={() => setMenu('closed')}
          className={"hamburger-links " + linksClass}>
          {menu === 'lang' ? languageLinks : navLinks}
        </div>
      </div>
    );
  }
}

Hamburger.defaultProps = {
  routes: []
};

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

export default connect(mapStateToProps, mapStateToDispatch)(Hamburger);