import React from 'react';
import {NavLink} from 'react-router-dom';
import {connect} from 'react-redux';
import {setMenu} from '../actions/set-menu';
import {changeLanguage} from '../actions/change-language';
import {bindActionCreators} from 'redux';
import Language from '../utilities/language';
import NavIcon from './NavIcon';
import {login} from '../actions/login';
import {logout} from '../actions/logout';
import Dropdown from './Dropdown';

class Hamburger extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false
    }
  }

  render() {
    const {routes, className, menu, setMenu, language, isAuthenticated} = this.props;

    const langOpen = menu === 'lang';
    const menuOpen = menu === 'links';
    const closed = menu === 'closed';
    const linksClass = closed ? 'closed' : 'open';
    const dropdown = [
      {value: 'spanish', text: Language.get(language, 'spanish')},
      {value: 'english', text: Language.get(language, 'english')},
    ];

    return (
      <div className={"hamburger " + className}>
        <div className="nav-button-container d-sm-none d-none d-md-block">
          {isAuthenticated ? null : <NavLink
            style={{display: 'inline-block'}}
            to='/register'
            className="mr-1"
            activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
            <button className="btn btn-primary">
              {Language.get(language, 'button.register')}
            </button>
          </NavLink>}
          {isAuthenticated ? (
            <NavLink
              style={{display: 'inline-block'}}
              to='/'
              activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
              <button
                onClick={() => this.props.logout()}
                className="btn btn-primary">
                {Language.get(language, 'button.logout')}
              </button>
            </NavLink>
          ) : (
            <NavLink
              style={{display: 'inline-block'}}
              to='/login'
              activeStyle={{color: 'rgba(255, 0, 0, 1)'}}>
              <button className="btn btn-primary">
                {Language.get(language, 'button.login')}
              </button>
            </NavLink>
          )}
        </div>
        <div>
          <Dropdown
            value={language}
            className="d-sm-none d-none d-md-block"
            onChange={(e) => {
              this.props.changeLanguage(e.target.value);
              this.props.setMenu('closed');
            }}
            options={dropdown}
          />
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
    logout: bindActionCreators(logout, dispatch),
    setMenu: bindActionCreators(setMenu, dispatch),
    changeLanguage: bindActionCreators(changeLanguage, dispatch),
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(Hamburger);