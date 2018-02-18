import React from 'react';
import {connect} from 'react-redux';
import {changeLanguage} from '../actions/change-language';
import {bindActionCreators} from 'redux';
import {setMenu} from '../actions/set-menu';
import {withRouter} from 'react-router-dom';
import Language from '../utilities/language';

class MenuOverlay extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {language} = this.props;

    return (
      <div className={"language-dropdown " + this.props.className}>
        <i className="fa fa-2x fa-globe"/>
        <select
          style={{paddingLeft: '2rem', display: 'inline-block'}}
          value={language}
          onChange={e => {
            this.props.changeLanguage(e.target.value);
            this.props.setMenu('closed');
          }}
          className="form-control">
          <option value="spanish">
            {Language.get(language, 'spanish')}
          </option>
          <option value="english">
            {Language.get(language, 'english')}
          </option>
        </select>
      </div>
    );
  }
}

MenuOverlay.defaultProps = {
  className: ''
};

const mapStateToProps = state => {
  const {
    language,
  } = state;


  return {language};
};

const mapStateToDispatch = dispatch => {
  return {
    setMenu: bindActionCreators(setMenu, dispatch),
    changeLanguage: bindActionCreators(changeLanguage, dispatch),
  }
};

export default withRouter(connect(mapStateToProps, mapStateToDispatch)(MenuOverlay));