import React from 'react';
import {connect} from 'react-redux';
import {changeLanguage} from '../actions/change-language';
import {bindActionCreators} from 'redux';
import {setMenu} from '../actions/set-menu';
import {withRouter} from 'react-router-dom';

class Dropdown extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {value} = this.props;

    return (
      <div className={"language-dropdown " + this.props.className}>
        <select
          style={{display: 'inline-block', fontSize: '16px'}}
          value={value}
          onChange={this.props.onChange}
          className="form-control">
          {this.props.options.map(option => {
            return (
              <option value={option.value}>
                {option.text}
              </option>
            )
          })}
        </select>
      </div>
    );
  }
}

Dropdown.defaultProps = {
  className: '',
  options: []
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

export default withRouter(connect(mapStateToProps, mapStateToDispatch)(Dropdown));