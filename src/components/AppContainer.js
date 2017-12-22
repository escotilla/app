import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

class AppContainer extends React.Component {
  componentDidMount() {
    this.props.loadUser();
  }

  render() {
    console.log(this);
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    user,
  } = state;

  return { user };
};

export default connect(mapStateToProps)(AppContainer);