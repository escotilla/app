import React from 'react';
import {NavLink} from 'react-router-dom';
import {connect} from 'react-redux';
import {setMenu} from '../actions/set-menu';
import {changeLanguage} from '../actions/change-language';
import {bindActionCreators} from 'redux';
import Language from '../utilities/language';
import NavIcon from './NavIcon';
import {login} from '../actions/login';
import LanguageDropdown from './LanguageDropdown';

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

    const langOpen = menu === 'lang';
    const menuOpen = menu === 'links';
    const closed = menu === 'closed';
    const linksClass = closed ? 'closed' : 'open';

    return (
      <div className={"hamburger " + className}>
        <div className="nav-button-container d-sm-none d-none d-md-block">
          <NavLink
            style={{display: 'inline-block'}}
            to='/register'
            className="mr-1"
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            <button className="btn btn-primary">
              {Language.get(language, 'button.register')}
            </button>
          </NavLink>
          <NavLink
            style={{display: 'inline-block'}}
            to='/login'
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            <button className="btn btn-primary">
              {Language.get(language, 'button.login')}
            </button>
          </NavLink>
        </div>
        <div>
        <LanguageDropdown  className="d-sm-none d-none d-md-block"/>
        </div>
        <NavIcon
          selected={menuOpen}
          icon={menuOpen ? "fa-times-circle" : "fa-bars"}
          onClick={() => menuOpen ? setMenu('closed') : setMenu('links')}/>

      </div>
    );
  }
}

Hamburger.defaultProps = {
  routes: [],
  className: ''
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
    login: bindActionCreators(login, dispatch),
    setMenu: bindActionCreators(setMenu, dispatch),
    changeLanguage: bindActionCreators(changeLanguage, dispatch),
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(Hamburger);