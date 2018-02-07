import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {boot} from '../actions/load-user';

class AppContainer extends React.Component {
  componentDidMount() {
    this.props.boot();
  }

  render() {
    if (this.props.booting) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          background: '#212121',
          position: 'fixed',
          top: 0,
          left: 0
        }}>
          <div className="loader"/>
        </div>
      );
    }

    return (
      <div className="container-fluid">
        {this.props.children}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    boot,
  } = state;

  return {booting: boot.booting};
};

const mapDispatchToProps = dispatch => {
  return {
    boot: bindActionCreators(boot, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
